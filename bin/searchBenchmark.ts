/* eslint-disable no-console */
import { createInterface } from 'node:readline'

import {
  getBoolean,
  getNonNegativeInteger,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  isSearchBenchmarkCaseId,
  PROFILE_SEARCH_QUERIES,
  searchBenchmarkUsage,
  type SearchBenchmarkCaseId,
} from '../benchmarks/searchCases'
import { median } from '../benchmarks/stats'
import { createFieldSearchRule } from '../packages/search/src/rules/search/fieldSearchRule'
import { searchProject } from '../packages/search/src/searchProject'
import type { ProjectFiles } from '../packages/ssr'

type BenchmarkRunner = () => Promise<void> | void

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

type SearchArgs = {
  caseId?: SearchBenchmarkCaseId
  repeat: number
  isWorker: boolean
  runs: number
  warmup: number
  outputPath?: string
  json: boolean
  profile: boolean
}

export const parseSearchArgs = (
  argv: readonly string[] = Bun.argv.slice(2),
): SearchArgs => {
  const args = parseBenchmarkArgs(argv)
  const isProfile = getBoolean(args, '--profile', false)
  const caseIdRaw = args.get('--case')
  const caseId = isSearchBenchmarkCaseId(caseIdRaw) ? caseIdRaw : undefined

  if (!isProfile && !caseId && !getBoolean(args, '--worker', false)) {
    throw new Error(
      `Usage: bun bin/searchBenchmark.ts ${searchBenchmarkUsage()} (or --profile)`,
    )
  }

  return {
    caseId,
    repeat: getPositiveInteger(args, '--repeat', 1),
    isWorker: getBoolean(args, '--worker', false),
    runs: getPositiveInteger(args, '--runs', 1),
    warmup: getNonNegativeInteger(args, '--warmup', 0),
    outputPath: getOptionalString(args, '--output'),
    json: getBoolean(args, '--json', false),
    profile: isProfile,
  }
}

const loadProjectFixture = async (fileName: string) => {
  const fixtureUrl = new URL(
    `../benchmarks/browser/fixtures/${fileName}`,
    import.meta.url,
  )
  const fixture = (await Bun.file(fixtureUrl).json()) as { files: ProjectFiles }
  for (const comp of Object.values(fixture.files.components ?? {})) {
    if (!comp) {
      continue
    }
    for (const ctx of Object.values(comp.contexts ?? {})) {
      if (!ctx.workflows) {
        ctx.workflows = []
      }
      if (!ctx.formulas) {
        ctx.formulas = []
      }
    }
  }
  return fixture
}

const runQueryOnFiles = (files: ProjectFiles, query: string) =>
  Array.from(
    searchProject({
      files,
      rules: [
        createFieldSearchRule({
          query,
          skippedFields:
            (query.startsWith('<') && query.includes('>')) ||
            (query.startsWith('"') && query.endsWith('"'))
              ? {}
              : {
                  'component-node': ['children'],
                },
        }),
      ],
    }),
  )

export const createRunner = async (
  id: SearchBenchmarkCaseId,
): Promise<BenchmarkRunner> => {
  const fixture = await loadProjectFixture('nordcraft.com.json')
  switch (id) {
    case 'freetext-nordcraft': {
      return () => {
        runQueryOnFiles(fixture.files, 'nordcraft')
      }
    }
    case 'regex-nordcraft': {
      return () => {
        runQueryOnFiles(fixture.files, '/nordcraft/i')
      }
    }
    case 'selector-nordcraft': {
      return () => {
        runQueryOnFiles(fixture.files, '<img[alt]>')
      }
    }
    case 'reference-nordcraft': {
      const refQueries = [
        '@component:"nc-heading-1"',
        '@component:nc-',
        '@formula:"404"/myFormula',
        '@workflow:"404"/myWorkflow',
        '@var:isOpen',
        '@event:click',
        '@css:--grey-900',
      ]
      return () => {
        for (const q of refQueries) {
          runQueryOnFiles(fixture.files, q)
        }
      }
    }
    case 'all-queries-nordcraft': {
      return () => {
        for (const { query } of PROFILE_SEARCH_QUERIES) {
          runQueryOnFiles(fixture.files, query)
        }
      }
    }
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

const runDirect = async (runner: BenchmarkRunner, options: SearchArgs) => {
  for (let i = 0; i < options.warmup; i++) {
    await measure(runner, options.repeat)
  }

  const timesMs: number[] = []
  for (let i = 0; i < options.runs; i++) {
    timesMs.push(await measure(runner, options.repeat))
  }

  const medianTime = median(timesMs)
  if (options.outputPath) {
    await Bun.write(
      options.outputPath,
      JSON.stringify(
        {
          caseId: options.caseId,
          repeat: options.repeat,
          medianTimeMs: medianTime,
          timesMs,
        },
        null,
        2,
      ),
    )
  }

  if (options.json) {
    console.log(
      JSON.stringify({
        caseId: options.caseId,
        repeat: options.repeat,
        medianTimeMs: medianTime,
        timesMs,
      }),
    )
  } else {
    console.log(
      `[${options.caseId}] median: ${medianTime.toFixed(2)} ms (${timesMs.length} samples)`,
    )
  }
}

export type QueryProfileResult = {
  query: string
  category: string
  durationMs: number
  percentOfTotal: number
  matchesFound: number
}

export type SearchProfileReport = {
  totalDurationMs: number
  queries: QueryProfileResult[]
}

export const profileQueries = async (): Promise<SearchProfileReport> => {
  const fixture = await loadProjectFixture('nordcraft.com.json')
  const timings: Array<{
    query: string
    category: string
    durationMs: number
    matchesFound: number
  }> = []

  // Warmup run
  runQueryOnFiles(fixture.files, '<div>')

  for (const item of PROFILE_SEARCH_QUERIES) {
    collectGarbage()
    const start = performance.now()
    const results = runQueryOnFiles(fixture.files, item.query)
    const durationMs = performance.now() - start
    timings.push({
      query: item.query,
      category: item.category,
      durationMs,
      matchesFound: results.length,
    })
  }

  timings.sort((a, b) => b.durationMs - a.durationMs)
  const totalDurationMs = timings.reduce((acc, t) => acc + t.durationMs, 0)

  return {
    totalDurationMs,
    queries: timings.map((t) => ({
      ...t,
      percentOfTotal: (t.durationMs / totalDurationMs) * 100,
    })),
  }
}

export const runProfile = async (json = false) => {
  console.log(
    'Profiling individual search queries on real-world nordcraft.com fixture...',
  )
  const report = await profileQueries()

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const rows = report.queries.map((t) => {
    return `| \`${t.query}\` | ${t.category} | ${t.durationMs.toFixed(2)} ms | ${t.percentOfTotal.toFixed(1)}% | ${t.matchesFound} |`
  })

  const markdown = [
    '',
    `## ⏱️ Search Queries Profile (Real-world nordcraft.com, Total: ${report.totalDurationMs.toFixed(2)} ms)`,
    '',
    '| Query | Category | Time (ms) | % of Total | Matches Found |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n')

  console.log(markdown)
}

async function main() {
  const options = parseSearchArgs()
  if (options.profile) {
    await runProfile(options.json)
    return
  }

  if (!options.caseId) {
    throw new Error('Missing benchmark case id')
  }

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
