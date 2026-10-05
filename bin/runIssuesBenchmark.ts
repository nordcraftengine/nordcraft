/* eslint-disable no-console */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

import {
  getBoolean,
  getNonNegativeInteger,
  getNumber,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  ISSUE_BENCHMARK_CASES,
  isIssueBenchmarkCaseId,
  type IssueBenchmarkCaseId,
} from '../benchmarks/issueCases'
import {
  formatMs,
  formatPercent,
  hasInformativeTimingSamples,
  summarizeTimeBenchmark,
} from '../benchmarks/stats'

export type Config = {
  baseRef?: string
  caseId?: IssueBenchmarkCaseId
  runs: number
  warmup: number
  repeat: number
  noiseThresholdPercent: number
  maxRegressionPercent: number
  maxRegressionMs: number
  responseTimeoutMs: number
  bootstrapIterations: number
  bootstrapSeed: number
  failOnRegression: boolean
  skipBuild: boolean
  outputDir?: string
  keepWorktree: boolean
  exportJson?: string
  exportMarkdown?: string
}

export type WorkerResponse = { timeMs: number } | { error: string }

type IssuesWorker = {
  run: (count?: number) => Promise<number>
  close: () => Promise<void>
}

export const parseArgs = parseBenchmarkArgs

export const parseConfig = (
  argv: readonly string[] = Bun.argv.slice(2),
): Config => {
  const args = parseArgs(argv)
  const baseRefArg = args.get('--base-ref')
  const baseRef =
    baseRefArg === undefined
      ? 'origin/main'
      : baseRefArg.length > 0
        ? baseRefArg
        : undefined

  const caseArg = args.get('--case')
  const caseId = isIssueBenchmarkCaseId(caseArg) ? caseArg : undefined

  const config: Config = {
    baseRef,
    caseId,
    runs: getPositiveInteger(args, '--runs', 10),
    warmup: getNonNegativeInteger(args, '--warmup', 2),
    repeat: getPositiveInteger(args, '--repeat', 1),
    noiseThresholdPercent: getNumber(args, '--noise-threshold', 2.0),
    maxRegressionPercent: getNumber(args, '--max-regression', 5.0),
    maxRegressionMs: getNumber(args, '--max-regression-ms', 5.0),
    responseTimeoutMs: getPositiveInteger(
      args,
      '--response-timeout-ms',
      60_000,
    ),
    bootstrapIterations: getPositiveInteger(
      args,
      '--bootstrap-iterations',
      1000,
    ),
    bootstrapSeed: getNumber(args, '--bootstrap-seed', 0),
    failOnRegression: getBoolean(args, '--fail-on-regression', false),
    skipBuild: getBoolean(args, '--skip-build', false),
    outputDir: getOptionalString(args, '--output-dir'),
    keepWorktree: getBoolean(args, '--keep-worktree', false),
    exportJson: getOptionalString(args, '--export-json'),
    exportMarkdown: getOptionalString(args, '--export-markdown'),
  }

  if (config.runs < 2) {
    throw new Error('--runs must be at least 2 for a statistical comparison')
  }

  return config
}

const runCommand = (
  command: string[],
  options?: {
    cwd?: string
  },
) => {
  const result = Bun.spawnSync(command, {
    cwd: options?.cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (${result.exitCode}): ${command.join(' ')}`)
  }
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const removeBenchmarkWorktree = (worktreePath: string) => {
  if (!existsSync(worktreePath)) {
    Bun.spawnSync(['git', 'worktree', 'prune'], {
      cwd: repositoryRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return
  }

  const cleanupResult = Bun.spawnSync(
    ['git', 'worktree', 'remove', worktreePath, '--force'],
    {
      cwd: repositoryRoot,
      stdout: 'inherit',
      stderr: 'inherit',
    },
  )
  if (cleanupResult.exitCode !== 0) {
    console.warn(
      `Could not remove benchmark worktree cleanly; pruning stale registration for ${worktreePath}`,
    )
    Bun.spawnSync(['git', 'worktree', 'prune'], {
      cwd: repositoryRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    })
  }
  rmSync(worktreePath, { recursive: true, force: true })
}

const copyBenchmarkAssets = (worktree: string) => {
  const assets = [
    'bin/issuesBenchmark.ts',
    'benchmarks/cli.ts',
    'benchmarks/issueCases.ts',
    'benchmarks/stats.ts',
    'benchmarks/browser/fixtures/benchmark-project.json',
  ]

  for (const asset of assets) {
    const source = resolve(repositoryRoot, asset)
    const destination = join(worktree, asset)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(source, destination)
  }
}

const isWorkerResponse = (value: unknown): value is WorkerResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if ('error' in value) {
    return typeof value.error === 'string' && !('timeMs' in value)
  }
  return (
    'timeMs' in value &&
    typeof value.timeMs === 'number' &&
    Number.isFinite(value.timeMs) &&
    value.timeMs > 0
  )
}

const startWorker = ({
  cwd,
  caseId,
  repeat,
  responseTimeoutMs,
}: {
  cwd: string
  caseId: IssueBenchmarkCaseId
  repeat: number
  responseTimeoutMs: number
}): IssuesWorker => {
  const child = spawn(
    'bun',
    [
      'bin/issuesBenchmark.ts',
      `--case=${caseId}`,
      `--repeat=${repeat}`,
      '--worker=true',
    ],
    {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  ) as ChildProcessWithoutNullStreams

  let stderr = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk
  })

  const responseLines = createInterface({ input: child.stdout })
  const responses = responseLines[Symbol.asyncIterator]()
  let processError: Error | undefined
  child.once('error', (error) => {
    processError = error
  })

  const readResponse = async (): Promise<number> => {
    if (processError) {
      throw processError
    }

    const nextPromise = responses.next()
    const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
      const timeoutTimer = setTimeout(() => {
        child.kill()
        rejectTimeout(
          new Error(
            `Issues benchmark worker timed out after ${responseTimeoutMs} ms`,
          ),
        )
      }, responseTimeoutMs)
      void nextPromise.finally(() => clearTimeout(timeoutTimer))
    })

    const next = await Promise.race([nextPromise, timeoutPromise])
    if (next.done) {
      throw new Error('Issues benchmark worker closed stdout unexpectedly')
    }

    let response: unknown
    try {
      response = JSON.parse(next.value) as unknown
    } catch (error) {
      throw new Error(
        `Invalid response from issues benchmark worker: ${next.value}`,
        { cause: error },
      )
    }

    if (!isWorkerResponse(response)) {
      throw new Error(
        `Invalid response from issues benchmark worker: ${next.value}`,
      )
    }
    if ('error' in response) {
      throw new Error(`Issues benchmark worker failed: ${response.error}`)
    }
    return response.timeMs
  }

  let closed = false
  return {
    run: async (count = 1) => {
      if (!child.stdin.writable || child.stdin.destroyed) {
        throw new Error('Issues benchmark worker is not running')
      }
      child.stdin.write(`${JSON.stringify({ type: 'run', count })}\n`)
      return readResponse()
    },
    close: async () => {
      if (closed) {
        return
      }
      closed = true
      if (child.stdin.writable && !child.stdin.destroyed) {
        try {
          child.stdin.write(`${JSON.stringify({ type: 'close' })}\n`)
          child.stdin.end()
        } catch {
          child.kill()
        }
      }
      responseLines.close()
    },
  }
}

const runCase = async ({
  caseId,
  name,
  config,
  baseWorktree,
}: {
  caseId: IssueBenchmarkCaseId
  name: string
  config: Config
  baseWorktree?: string
}) => {
  console.log(`\n== Running Benchmark: ${name} ==`)

  let headWorker: IssuesWorker | undefined
  let baseWorker: IssuesWorker | undefined
  const baseTimes: number[] = []
  const headTimes: number[] = []

  const runFor = async (worker: IssuesWorker, times: number[]) => {
    if (times.length < config.runs) {
      times.push(await worker.run())
    }
  }

  try {
    headWorker = startWorker({
      cwd: repositoryRoot,
      caseId,
      repeat: config.repeat,
      responseTimeoutMs: config.responseTimeoutMs,
    })
    baseWorker = baseWorktree
      ? startWorker({
          cwd: baseWorktree,
          caseId,
          repeat: config.repeat,
          responseTimeoutMs: config.responseTimeoutMs,
        })
      : undefined

    for (let i = 0; i < config.warmup; i++) {
      await headWorker.run()
      if (baseWorker) {
        await baseWorker.run()
      }
    }

    const pairs = Math.ceil(config.runs / 2)
    for (let pair = 0; pair < pairs; pair++) {
      const order =
        pair % 2 === 0
          ? (['base', 'head', 'head', 'base'] as const)
          : (['head', 'base', 'base', 'head'] as const)
      for (const side of order) {
        if (side === 'base' && baseWorker) {
          await runFor(baseWorker, baseTimes)
        } else if (side === 'head') {
          await runFor(headWorker, headTimes)
        }
      }
    }
  } finally {
    await Promise.allSettled([headWorker?.close(), baseWorker?.close()])
  }

  if (baseWorker) {
    if (!hasInformativeTimingSamples(baseTimes)) {
      throw new Error(
        `Benchmark ${caseId} returned invalid base timing samples`,
      )
    }
  } else {
    baseTimes.push(...headTimes)
  }

  const isAATest = !baseWorker
  const summary = summarizeTimeBenchmark({
    baseTimes,
    headTimes,
    isAATest,
    noiseThresholdPercent: config.noiseThresholdPercent,
    maxRegressionPercent: config.maxRegressionPercent,
    maxRegressionMs: config.maxRegressionMs,
    bootstrapIterations: config.bootstrapIterations,
    bootstrapSeed: config.bootstrapSeed,
  })

  return {
    id: caseId,
    name,
    mode: isAATest ? 'a/a' : 'comparison',
    ...summary,
  }
}

const formatVerdict = (status: string) => {
  switch (status) {
    case 'improvement':
      return '🚀 Improvement'
    case 'regression':
      return '❌ Regression'
    case 'ok':
    case '1:1':
    case 'stable':
      return '✅ 1:1'
    case 'inconclusive':
      return '⚠️ Inconclusive'
    default:
      return status
  }
}

const writeReport = (
  results: Array<Awaited<ReturnType<typeof runCase>>>,
  baseRef?: string,
) => {
  const rows = results.map((result) => {
    const ciLow = formatPercent(result.ciLowPercent)
    const ciHigh = formatPercent(result.ciHighPercent)
    const pValue = result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(3)
    return `| ${result.name} | ${formatMs(result.baseMedianMs)} | ${formatMs(result.headMedianMs)} | ${formatPercent(result.deltaPercent)} | [${ciLow}, ${ciHigh}] | ${pValue} | ${formatVerdict(result.timeStatus)} |`
  })

  const markdown = [
    '## ⚡ Issues Search & Autofix Performance Benchmark',
    '',
    `- **Base ref**: \`${baseRef ?? 'none (standalone)'}\``,
    `- **Head ref**: current branch`,
    '',
    '| Benchmark Case | Base Median | Head Median | Delta % | 95% CI | p-value | Verdict |',
    '|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n')

  console.log(`\n${markdown}\n`)
}

export async function main() {
  const config = parseConfig()
  let baseWorktree: string | undefined

  if (config.baseRef) {
    baseWorktree = await mkdtemp(join(tmpdir(), 'nordcraft-issues-base-'))
    console.log(
      `Setting up base git worktree from ${config.baseRef} at ${baseWorktree}...`,
    )
    try {
      runCommand(['git', 'worktree', 'add', baseWorktree, config.baseRef], {
        cwd: repositoryRoot,
      })
      console.log(`Installing dependencies in base worktree...`)
      runCommand(['bun', 'install', '--frozen-lockfile'], { cwd: baseWorktree })
      copyBenchmarkAssets(baseWorktree)
      if (!config.skipBuild) {
        console.log(`Building packages in base worktree...`)
        runCommand(['bun', 'run', 'build'], { cwd: baseWorktree })
      }
    } catch (err) {
      removeBenchmarkWorktree(baseWorktree)
      throw err
    }
  }

  try {
    const casesToRun = config.caseId
      ? ISSUE_BENCHMARK_CASES.filter((c) => c.id === config.caseId)
      : ISSUE_BENCHMARK_CASES

    const results = []
    for (const benchmarkCase of casesToRun) {
      results.push(
        await runCase({
          caseId: benchmarkCase.id,
          name: benchmarkCase.name,
          config,
          baseWorktree,
        }),
      )
    }

    writeReport(results, config.baseRef)
  } finally {
    if (baseWorktree && !config.keepWorktree) {
      console.log(`Cleaning up base worktree...`)
      removeBenchmarkWorktree(baseWorktree)
    }
  }
}

if (import.meta.main) {
  await main()
}
