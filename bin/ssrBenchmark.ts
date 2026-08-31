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

type ExampleProject = {
  files: ProjectFiles
}

const args = new Map(
  Bun.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value]
  }),
)

type CaseId = 'formula' | 'collections-hot-path' | 'example-project-homepage'

const repeatCount = Number(args.get('--repeat') ?? 1)
if (!Number.isInteger(repeatCount) || repeatCount < 1) {
  throw new Error('--repeat must be a positive integer')
}

const isCaseId = (value: string | undefined): value is CaseId =>
  value === 'formula' ||
  value === 'collections-hot-path' ||
  value === 'example-project-homepage'

const caseIdValue = args.get('--case')
if (!isCaseId(caseIdValue)) {
  throw new Error(
    'Usage: bun bin/ssrBenchmark.ts --case=<formula|collections-hot-path|example-project-homepage>',
  )
}
const caseId = caseIdValue

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
  const page = files.components.HomePage

  if (!page || !page.route) {
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

switch (caseId) {
  case 'formula': {
    const runner = createFormulaCase()
    for (let i = 0; i < repeatCount; i++) {
      runner()
    }
    break
  }
  case 'collections-hot-path': {
    const runner = createCollectionsHotPathRenderCase()
    for (let i = 0; i < repeatCount; i++) {
      await runner()
    }
    break
  }
  case 'example-project-homepage': {
    const runner = await createProjectRenderCase()
    for (let i = 0; i < repeatCount; i++) {
      await runner()
    }
    break
  }
  default: {
    throw new Error(`Unknown benchmark case: ${caseId}`)
  }
}
