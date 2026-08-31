import type {
  Component,
  ComponentData,
  ComponentVariable,
  PageComponent,
} from '../packages/core/dist/component/component.types'
import type { FormulaContext } from '../packages/core/dist/formula/formula'
import {
  applyFormula,
  type Formula,
} from '../packages/core/dist/formula/formula'
import { takeIncludedComponents } from '../packages/ssr/dist/components/utils'
import { renderPageBody } from '../packages/ssr/dist/rendering/components'
import {
  getPageFormulaContext,
  serverEnv,
} from '../packages/ssr/dist/rendering/formulaContext'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'

type BenchmarkResult = {
  name: string
  unit: 'ms/op'
  samples: number[]
  average: number
  median: number
  min: number
  max: number
}

type BenchmarkOutput = {
  generatedAt: string
  runtime: string
  warmup: number
  samples: number
  iterationsPerSample: number
  results: BenchmarkResult[]
}

type ExampleProject = {
  files: ProjectFiles
}

const args = new Map(
  Bun.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value]
  }),
)

const warmup = Number(args.get('--warmup') ?? 5)
const samples = Number(args.get('--samples') ?? 20)
const iterationsPerSample = Number(args.get('--iterations') ?? 1)
const outputPath = args.get('--output')

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const half = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[half - 1] + sorted[half]) / 2
  }
  return sorted[half]
}

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

const runCase = async (
  name: string,
  runner: () => void | Promise<void>,
  options?: {
    runsPerSample?: number
  },
): Promise<BenchmarkResult> => {
  const runsPerSample = options?.runsPerSample ?? 1
  const totalRunsPerSample = runsPerSample * iterationsPerSample

  for (let i = 0; i < warmup; i++) {
    for (let j = 0; j < totalRunsPerSample; j++) {
      await runner()
    }
  }

  const sampleDurations: number[] = []
  for (let i = 0; i < samples; i++) {
    const start = performance.now()
    for (let j = 0; j < totalRunsPerSample; j++) {
      await runner()
    }
    const elapsed = performance.now() - start
    sampleDurations.push(elapsed / totalRunsPerSample)
  }

  return {
    name,
    unit: 'ms/op',
    samples: sampleDurations,
    average: average(sampleDurations),
    median: median(sampleDurations),
    min: Math.min(...sampleDurations),
    max: Math.max(...sampleDurations),
  }
}

const createFormulaCase = () => {
  const data: ComponentData & {
    values: Array<{
      id: number
      title: string
      enabled: boolean
      score: number
      flags: {
        featured: boolean
        archived: boolean
      }
    }>
  } = {
    Attributes: {},
    values: Array.from({ length: 256 }, (_, i) => ({
      id: i,
      title: `item-${i}`,
      enabled: i % 3 !== 0,
      score: i,
      flags: {
        featured: i % 5 === 0,
        archived: i % 11 === 0,
      },
    })),
  }

  const formula: Formula = {
    type: 'object',
    arguments: [
      {
        name: 'meta',
        formula: {
          type: 'object',
          arguments: [
            {
              name: 'title',
              formula: {
                type: 'path',
                path: ['values', 0, 'title'],
              },
            },
            {
              name: 'id',
              formula: {
                type: 'path',
                path: ['values', 0, 'id'],
              },
            },
          ],
        },
      },
      {
        name: 'renderInfo',
        formula: {
          type: 'object',
          arguments: [
            {
              name: 'canRender',
              formula: {
                type: 'and',
                arguments: [
                  {
                    formula: {
                      type: 'path',
                      path: ['values', 0, 'enabled'],
                    },
                  },
                  {
                    formula: {
                      type: 'or',
                      arguments: [
                        {
                          formula: {
                            type: 'path',
                            path: ['values', 0, 'flags', 'featured'],
                          },
                        },
                        {
                          formula: {
                            type: 'and',
                            arguments: [
                              {
                                formula: {
                                  type: 'value',
                                  value: true,
                                },
                              },
                              {
                                formula: {
                                  type: 'path',
                                  path: ['values', 0, 'flags', 'archived'],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              name: 'label',
              formula: {
                type: 'switch',
                cases: [
                  {
                    condition: {
                      type: 'path',
                      path: ['values', 0, 'flags', 'featured'],
                    },
                    formula: {
                      type: 'value',
                      value: 'featured',
                    },
                  },
                  {
                    condition: {
                      type: 'path',
                      path: ['values', 0, 'flags', 'archived'],
                    },
                    formula: {
                      type: 'value',
                      value: 'archived',
                    },
                  },
                ],
                default: {
                  type: 'value',
                  value: 'normal',
                },
              },
            },
          ],
        },
      },
      {
        name: 'score',
        formula: {
          type: 'path',
          path: ['values', 0, 'score'],
        },
      },
    ],
  }

  const ctx: FormulaContext = {
    component: undefined,
    formulaCache: {},
    data,
    package: undefined,
    toddle: {
      getFormula: () => undefined,
      getCustomFormula: () => undefined,
      errors: [],
    },
    env: serverEnv({
      branchName: 'main',
      logErrors: false,
      req: new Request('http://localhost/benchmark'),
    }),
  }

  return () => {
    let sum = 0
    for (let i = 0; i < 3_000; i++) {
      const index = i % data.values.length
      data.values[0] = data.values[index]
      const result = applyFormula(formula, ctx)
      if (result?.renderInfo?.canRender) {
        sum += result.meta?.id ?? 0
      }
    }

    if (sum < 0) {
      throw new Error('Unexpected benchmark guard')
    }
  }
}

const createCollectionsHotPathRenderCase = () => {
  const items = Array.from({ length: 80 }, (_, i) => ({
    title: `Card ${i}`,
    subtitle: `Item ${i} subtitle`,
    important: i % 7 === 0,
    score: i,
    weight: i % 13,
  }))

  const variables: Record<string, ComponentVariable> = {}
  for (let i = 0; i < 24; i++) {
    variables[`var${i}`] = {
      initialValue: {
        type: 'switch',
        cases: [
          {
            condition: {
              type: 'path',
              path: ['Attributes', 'important'],
            },
            formula: {
              type: 'object',
              arguments: [
                {
                  name: 'kind',
                  formula: {
                    type: 'value',
                    value: 'featured',
                  },
                },
                {
                  name: 'score',
                  formula: {
                    type: 'path',
                    path: ['Attributes', 'score'],
                  },
                },
              ],
            },
          },
        ],
        default: {
          type: 'object',
          arguments: [
            {
              name: 'kind',
              formula: {
                type: 'value',
                value: 'normal',
              },
            },
            {
              name: 'score',
              formula: {
                type: 'path',
                path: ['Attributes', 'weight'],
              },
            },
          ],
        },
      },
    }
  }

  const itemComponent: Component = {
    name: 'HeavyItem',
    formulas: {
      summary: {
        name: 'summary',
        exposeInContext: true,
        formula: {
          type: 'object',
          arguments: [
            {
              name: 'title',
              formula: {
                type: 'path',
                path: ['Attributes', 'title'],
              },
            },
            {
              name: 'priority',
              formula: {
                type: 'switch',
                cases: [
                  {
                    condition: {
                      type: 'path',
                      path: ['Attributes', 'important'],
                    },
                    formula: {
                      type: 'value',
                      value: 'high',
                    },
                  },
                ],
                default: {
                  type: 'value',
                  value: 'normal',
                },
              },
            },
          ],
        },
      },
    },
    variables,
    nodes: {
      root: {
        type: 'element',
        tag: 'article',
        attrs: {},
        classes: {
          featured: {
            formula: {
              type: 'path',
              path: ['Attributes', 'important'],
            },
          },
        },
        events: {},
        style: {},
        children: ['title', 'subtitle', 'badge'],
      },
      title: {
        type: 'text',
        value: {
          type: 'path',
          path: ['Attributes', 'title'],
        },
      },
      subtitle: {
        type: 'text',
        value: {
          type: 'path',
          path: ['Attributes', 'subtitle'],
        },
      },
      badge: {
        type: 'text',
        value: {
          type: 'switch',
          cases: [
            {
              condition: {
                type: 'path',
                path: ['Attributes', 'important'],
              },
              formula: {
                type: 'value',
                value: 'important',
              },
            },
          ],
          default: {
            type: 'value',
            value: 'normal',
          },
        },
      },
    },
    apis: {},
    attributes: {
      title: { name: 'title', testValue: 't' },
      subtitle: { name: 'subtitle', testValue: 's' },
      important: { name: 'important', testValue: true },
      score: { name: 'score', testValue: 0 },
      weight: { name: 'weight', testValue: 0 },
    },
    events: [],
  }

  const pageComponent: PageComponent = {
    name: 'BenchmarkPage',
    route: {
      path: [],
      query: {},
    },
    nodes: {
      root: {
        type: 'element',
        tag: 'main',
        attrs: {},
        events: {},
        style: {},
        children: ['list'],
      },
      list: {
        type: 'component',
        name: 'HeavyItem',
        repeat: {
          type: 'path',
          path: ['Attributes', 'items'],
        },
        attrs: {
          title: {
            type: 'path',
            path: ['ListItem', 'Item', 'title'],
          },
          subtitle: {
            type: 'path',
            path: ['ListItem', 'Item', 'subtitle'],
          },
          important: {
            type: 'path',
            path: ['ListItem', 'Item', 'important'],
          },
          score: {
            type: 'path',
            path: ['ListItem', 'Item', 'score'],
          },
          weight: {
            type: 'path',
            path: ['ListItem', 'Item', 'weight'],
          },
        },
        children: [],
        events: {},
        style: {},
      },
    },
    formulas: {},
    apis: {},
    attributes: {
      items: { name: 'items', testValue: [] },
    },
    variables: {},
    events: [],
  }

  const files: ProjectFiles = {
    components: {
      BenchmarkPage: pageComponent,
      HeavyItem: itemComponent,
    },
    formulas: {},
    packages: {},
  }

  const req = new Request('http://localhost/benchmark')

  return async () => {
    const formulaContext = getPageFormulaContext({
      component: pageComponent,
      branchName: 'main',
      req,
      logErrors: false,
      files,
    })
    formulaContext.data.Attributes = {
      ...(formulaContext.data.Attributes ?? {}),
      items,
    }

    const result = await renderPageBody({
      component: pageComponent,
      env: formulaContext.env,
      evaluateComponentApis: async () => ({}),
      files,
      formulaContext,
      includedComponents: [pageComponent, itemComponent],
      req,
      projectId: 'benchmark-project',
    })

    if (result.html.length === 0) {
      throw new Error('Empty HTML from benchmark case')
    }
  }
}

const createProjectRenderCase = async () => {
  const projectPath = new URL(
    '../packages/backend/__project__/project.json',
    import.meta.url,
  ).pathname
  const exampleProject = JSON.parse(
    await Bun.file(projectPath).text(),
  ) as ExampleProject
  const files = exampleProject.files
  const page = files.components.HomePage as PageComponent | undefined

  if (!page) {
    throw new Error('No page component found in example project')
  }

  const req = new Request('http://localhost/')
  const includedComponents = takeIncludedComponents({
    packages: files.packages,
    root: page,
    includeRoot: true,
    projectComponents: files.components,
  })

  return async () => {
    const formulaContext = getPageFormulaContext({
      component: page,
      branchName: 'main',
      req,
      logErrors: false,
      files,
    })

    const result = await renderPageBody({
      component: page,
      env: formulaContext.env,
      evaluateComponentApis: async () => ({}),
      files,
      formulaContext,
      includedComponents,
      req,
      projectId: 'sample_test_os_project',
    })

    if (result.html.length === 0) {
      throw new Error('Empty HTML from project render benchmark')
    }
  }
}

const results = await Promise.all([
  runCase(
    'core.applyFormula (complex mix, 3k evals)',
    createFormulaCase(),
    { runsPerSample: 6 },
  ),
  runCase(
    'ssr.renderPageBody (collections hot path)',
    createCollectionsHotPathRenderCase(),
    { runsPerSample: 6 },
  ),
  runCase(
    'ssr.renderPageBody (example project HomePage)',
    await createProjectRenderCase(),
    { runsPerSample: 30 },
  ),
])

const output: BenchmarkOutput = {
  generatedAt: new Date().toISOString(),
  runtime: `bun ${Bun.version}`,
  warmup,
  samples,
  iterationsPerSample,
  results,
}

const printable = {
  ...output,
  results: output.results.map((result) => ({
    ...result,
    average: Number(result.average.toFixed(4)),
    median: Number(result.median.toFixed(4)),
    min: Number(result.min.toFixed(4)),
    max: Number(result.max.toFixed(4)),
    samples: result.samples.map((sample) => Number(sample.toFixed(4))),
  })),
}

const text = JSON.stringify(printable, null, 2)
if (outputPath) {
  await Bun.write(outputPath, `${text}\n`)
}

console.log(text)
