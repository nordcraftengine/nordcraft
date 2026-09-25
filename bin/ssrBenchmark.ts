import { createInterface } from 'node:readline'

import {
  getBoolean,
  getNonNegativeInteger,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  isSsrBenchmarkCaseId,
  ssrBenchmarkUsage,
  type SsrBenchmarkCaseId,
} from '../benchmarks/ssrCases'
import type {
  Component,
  ComponentData,
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

type BenchmarkProject = {
  files: ProjectFiles
}

type BenchmarkRunner = () => Promise<void>

type WorkerRequest = { type: 'close' } | { type: 'run'; count?: number }

type WorkerResponse = { timeMs: number } | { error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isWorkerRequest = (value: unknown): value is WorkerRequest => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }
  if (value.type === 'close') {
    return !('count' in value)
  }
  return (
    value.type === 'run' &&
    (value.count === undefined ||
      (typeof value.count === 'number' &&
        Number.isInteger(value.count) &&
        value.count >= 1))
  )
}

type SsrArgs = {
  caseId: SsrBenchmarkCaseId
  repeat: number
  isWorker: boolean
  runs: number
  warmup: number
  outputPath?: string
  json: boolean
}

export const parseSsrArgs = (
  argv: readonly string[] = Bun.argv.slice(2),
): SsrArgs => {
  const args = parseBenchmarkArgs(argv)
  const caseId = args.get('--case')
  if (!isSsrBenchmarkCaseId(caseId)) {
    throw new Error(`Usage: bun bin/ssrBenchmark.ts ${ssrBenchmarkUsage()}`)
  }

  return {
    caseId,
    repeat: getPositiveInteger(args, '--repeat', 1),
    isWorker: getBoolean(args, '--worker', false),
    runs: getPositiveInteger(args, '--runs', 1),
    warmup: getNonNegativeInteger(args, '--warmup', 0),
    outputPath: getOptionalString(args, '--output'),
    json: getBoolean(args, '--json', false),
  }
}

const loadProjectFixture = async (fileName: string) => {
  const fixtureUrl = new URL(
    `../benchmarks/browser/fixtures/${fileName}`,
    import.meta.url,
  )
  return (await Bun.file(fixtureUrl).json()) as BenchmarkProject
}

const createFormulaCase = (): BenchmarkRunner => {
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

  return async () => {
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

const isPageComponent = (
  component: Component | undefined,
): component is PageComponent =>
  component?.route !== undefined && component.route !== null

const createCollectionsHotPathRenderCase =
  async (): Promise<BenchmarkRunner> => {
    const project = await loadProjectFixture('benchmark-project.json')
    const files = project.files
    const page = files.components.HomePage

    if (!isPageComponent(page)) {
      throw new Error('No HomePage component found in benchmark project')
    }

    const pageComponent: PageComponent = page
    const items = Array.from({ length: 80 }, (_, i) => ({
      id: `item-${i}`,
      title: `Card ${i}`,
    }))
    const includedComponents = takeIncludedComponents({
      packages: files.packages,
      root: pageComponent,
      includeRoot: true,
      projectComponents: files.components,
    })
    const req = new Request('http://localhost/benchmark')

    return async () => {
      const formulaContext = getPageFormulaContext({
        component: pageComponent,
        branchName: 'main',
        req,
        logErrors: false,
        files,
      })
      formulaContext.data.Variables = {
        ...formulaContext.data.Variables,
        items,
      }

      const result = await renderPageBody({
        component: pageComponent,
        env: formulaContext.env,
        evaluateComponentApis: async () => ({}),
        files,
        formulaContext,
        includedComponents,
        req,
        projectId: 'benchmark-project',
      })

      if (result.html.length === 0) {
        throw new Error('Empty HTML from collections benchmark case')
      }
    }
  }

const createProjectRenderCase = async (): Promise<BenchmarkRunner> => {
  const project = await loadProjectFixture('nordcraft.com.json')
  const files = project.files
  const page = files.components.nordcraft

  if (!isPageComponent(page)) {
    throw new Error('No page component found in example project')
  }

  const pageComponent: PageComponent = page
  const req = new Request('http://localhost/')
  const includedComponents = takeIncludedComponents({
    packages: files.packages,
    root: pageComponent,
    includeRoot: true,
    projectComponents: files.components,
  })

  return async () => {
    const formulaContext = getPageFormulaContext({
      component: pageComponent,
      branchName: 'main',
      req,
      logErrors: false,
      files,
    })

    const result = await renderPageBody({
      component: pageComponent,
      env: formulaContext.env,
      evaluateComponentApis: async () => ({}),
      files,
      formulaContext,
      includedComponents,
      req,
      projectId: 'nordcraft',
    })

    if (result.html.length === 0) {
      throw new Error('Empty HTML from project render benchmark')
    }
  }
}

export const createRunner = async (id: SsrBenchmarkCaseId) => {
  switch (id) {
    case 'formula':
      return createFormulaCase()
    case 'collections-hot-path':
      return createCollectionsHotPathRenderCase()
    case 'example-project-homepage':
      return createProjectRenderCase()
  }
}

const collectGarbage = () => {
  if (typeof Bun !== 'undefined' && typeof Bun.gc === 'function') {
    Bun.gc(true)
  }
}

const measure = async (runner: BenchmarkRunner, repeat: number, count = 1) => {
  collectGarbage()
  const start = performance.now()
  for (let i = 0; i < count * repeat; i++) {
    await runner()
  }
  return (performance.now() - start) / (count * repeat)
}

const writeWorkerResponse = (response: WorkerResponse) => {
  process.stdout.write(`${JSON.stringify(response)}\n`)
}

const runWorker = async (runner: BenchmarkRunner, repeat: number) => {
  const input = createInterface({ input: process.stdin })

  for await (const line of input) {
    if (!line.trim()) {
      continue
    }

    let request: unknown
    try {
      request = JSON.parse(line) as unknown
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    if (!isWorkerRequest(request)) {
      writeWorkerResponse({ error: 'Invalid worker request' })
      continue
    }

    if (request.type === 'close') {
      break
    }

    if (request.type !== 'run') {
      writeWorkerResponse({ error: `Unknown worker command: ${request.type}` })
      continue
    }

    try {
      const count = request.count ?? 1
      if (!Number.isInteger(count) || count < 1) {
        throw new Error('Worker run count must be a positive integer')
      }
      writeWorkerResponse({ timeMs: await measure(runner, repeat, count) })
    } catch (error) {
      writeWorkerResponse({
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const runDirect = async (runner: BenchmarkRunner, options: SsrArgs) => {
  for (let i = 0; i < options.warmup; i++) {
    await measure(runner, options.repeat)
  }

  const timesMs: number[] = []
  for (let i = 0; i < options.runs; i++) {
    timesMs.push(await measure(runner, options.repeat))
  }
  const result = {
    caseId: options.caseId,
    repeat: options.repeat,
    timesMs,
  }

  if (options.outputPath) {
    await Bun.write(options.outputPath, `${JSON.stringify(result, null, 2)}\n`)
  } else if (options.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  }
}

export const main = async (argv: readonly string[] = Bun.argv.slice(2)) => {
  const options = parseSsrArgs(argv)
  const runner = await createRunner(options.caseId)
  if (options.isWorker) {
    await runWorker(runner, options.repeat)
  } else {
    await runDirect(runner, options)
  }
}

if (import.meta.main) {
  await main()
}
