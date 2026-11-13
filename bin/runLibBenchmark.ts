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
  isLibBenchmarkCaseId,
  isSkippedLibBenchmarkCase,
  LIB_BENCHMARK_CASES,
  type LibBenchmarkCaseId,
} from '../benchmarks/libCases'
import {
  formatMs,
  formatPercent,
  hasInformativeTimingSamples,
  summarizeTimeBenchmark,
} from '../benchmarks/stats'

export type Config = {
  baseRef?: string
  caseId?: LibBenchmarkCaseId
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
  includeSkipped: boolean
  outputDir?: string
  keepWorktree: boolean
  exportJson?: string
  exportMarkdown?: string
}

export type WorkerResponse = { timeMs: number } | { error: string }

type LibWorker = {
  run: (count?: number) => Promise<number>
  close: () => Promise<void>
}

export const parseArgs = parseBenchmarkArgs

export const parseConfig = (argv: readonly string[] = Bun.argv.slice(2)) => {
  const args = parseArgs(argv)
  const baseRefArg = args.get('--base-ref')
  const baseRef =
    baseRefArg === undefined
      ? 'origin/main'
      : baseRefArg.length > 0
        ? baseRefArg
        : undefined
  const caseArg = args.get('--case')
  const caseId = isLibBenchmarkCaseId(caseArg) ? caseArg : undefined
  if (caseArg !== undefined && caseId === undefined) {
    throw new Error(
      `Unknown lib benchmark case: ${caseArg}. Use --case=<id> with a valid case id.`,
    )
  }
  const config: Config = {
    baseRef,
    caseId,
    runs: getPositiveInteger(args, '--runs', 15),
    warmup: getNonNegativeInteger(args, '--warmup', 3),
    repeat: getPositiveInteger(args, '--repeat', 5),
    noiseThresholdPercent: getNumber(args, '--noise-threshold-percent', 2.0),
    maxRegressionPercent: getNumber(args, '--max-regression-percent', 5.0),
    maxRegressionMs: getNumber(args, '--max-regression-ms', 0.5),
    responseTimeoutMs: getNumber(args, '--response-timeout-ms', 120_000),
    bootstrapIterations: getPositiveInteger(
      args,
      '--bootstrap-iterations',
      1000,
    ),
    bootstrapSeed: getNumber(args, '--bootstrap-seed', 0),
    failOnRegression: getBoolean(args, '--fail-on-regression', true),
    skipBuild: getBoolean(args, '--skip-build', false),
    includeSkipped: getBoolean(args, '--include-skipped', false),
    outputDir: getOptionalString(args, '--output-dir'),
    keepWorktree: getBoolean(args, '--keep-worktree', false),
    exportJson: getOptionalString(args, '--export-json'),
    exportMarkdown: getOptionalString(args, '--export-markdown'),
  }

  if (config.baseRef && config.skipBuild) {
    throw new Error(
      '--skip-build=true is not supported together with --base-ref. The base worktree needs dependencies and compiled dist files.',
    )
  }

  if (config.runs < 2) {
    throw new Error('--runs must be at least 2 for a statistical comparison')
  }

  if (
    config.noiseThresholdPercent < 0 ||
    config.maxRegressionPercent < 0 ||
    config.maxRegressionMs < 0
  ) {
    throw new Error('Benchmark thresholds must not be negative')
  }
  if (config.responseTimeoutMs <= 0) {
    throw new Error('--response-timeout-ms must be greater than 0')
  }
  if (!Number.isInteger(config.bootstrapSeed)) {
    throw new Error('--bootstrap-seed must be an integer')
  }

  return config
}

export const resolveCasesToRun = ({
  caseId,
  includeSkipped,
}: {
  caseId?: LibBenchmarkCaseId
  includeSkipped: boolean
}) => {
  // An explicit --case=<id> always runs, even for skipped thin-passthrough
  // cases, so any case can be re-enabled ad hoc without editing the case list.
  if (caseId) {
    return LIB_BENCHMARK_CASES.filter(
      (benchmarkCase) => benchmarkCase.id === caseId,
    )
  }
  return LIB_BENCHMARK_CASES.filter(
    (benchmarkCase) =>
      includeSkipped || !isSkippedLibBenchmarkCase(benchmarkCase),
  )
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

const writeSection = (title: string) => {
  console.log(`\n== ${title} ==`)
}

const copyBenchmarkAssets = (worktree: string) => {
  const assets = [
    'bin/libBenchmark.ts',
    'benchmarks/cli.ts',
    'benchmarks/libCases.ts',
    'benchmarks/libFixtures.ts',
    'benchmarks/stats.ts',
  ]

  for (const asset of assets) {
    const source = resolve(repositoryRoot, asset)
    const destination = join(worktree, asset)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(source, destination)
  }
}

const preflightBuiltArtifacts = (cwd: string) => {
  // The lib benchmark imports std-lib handlers from source so base and head
  // are measured on their own revision without stale dist output.
  const requiredArtifacts = [
    'packages/lib/formulas.ts',
    'packages/lib/actions.ts',
    'benchmarks/libFixtures.ts',
  ]
  const missing = requiredArtifacts.filter(
    (artifact) => !existsSync(resolve(cwd, artifact)),
  )
  if (missing.length > 0) {
    throw new Error(
      `Missing lib benchmark sources in ${cwd}: ${missing.join(', ')}.`,
    )
  }
}

export const isWorkerResponse = (value: unknown): value is WorkerResponse => {
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
  caseId: LibBenchmarkCaseId
  repeat: number
  responseTimeoutMs: number
}): LibWorker => {
  const child = spawn(
    'bun',
    [
      'bin/libBenchmark.ts',
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
  const processErrorPromise = new Promise<never>((_, rejectProcess) => {
    child.once('error', (error) => {
      processError = error
      rejectProcess(error)
    })
  })
  processErrorPromise.catch(() => undefined)

  let exitPromise: Promise<number | null> | undefined
  const getExitPromise = () => {
    if (exitPromise) {
      return exitPromise
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      exitPromise = Promise.resolve(child.exitCode)
      return exitPromise
    }
    exitPromise = new Promise<number | null>((resolveExit) => {
      child.once('exit', (code) => resolveExit(code))
    })
    return exitPromise
  }

  const waitForExit = async (timeoutMs?: number) => {
    const exit = getExitPromise()
    if (timeoutMs === undefined) {
      return exit
    }

    let timeout: ReturnType<typeof setTimeout> | undefined
    const timedExit = new Promise<number | null>((resolveExit) => {
      timeout = setTimeout(() => {
        child.kill()
        resolveExit(null)
      }, timeoutMs)
    })
    try {
      return await Promise.race([exit, timedExit])
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
    }
  }

  const readResponse = async () => {
    if (processError) {
      throw processError
    }

    let timeout: ReturnType<typeof setTimeout> | undefined
    let timedOut = false
    const timeoutPromise = new Promise<IteratorResult<string>>((_, reject) => {
      timeout = setTimeout(() => {
        timedOut = true
        child.kill()
        reject(
          new Error(
            `Lib benchmark worker response timed out after ${responseTimeoutMs}ms${stderr ? `: ${stderr}` : ''}`,
          ),
        )
      }, responseTimeoutMs)
    })

    let next: IteratorResult<string>
    try {
      next = await Promise.race([
        responses.next(),
        timeoutPromise,
        processErrorPromise,
      ])
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
      if (timedOut) {
        await responses.return?.()
      }
    }

    if (next.done) {
      const exitCode = await waitForExit(responseTimeoutMs)
      throw new Error(
        `Lib benchmark worker exited before returning a result (${exitCode ?? 'unknown'})${stderr ? `: ${stderr}` : ''}`,
      )
    }

    let response: unknown
    try {
      response = JSON.parse(next.value) as unknown
    } catch (error) {
      throw new Error(
        `Invalid response from lib benchmark worker: ${next.value}`,
        { cause: error },
      )
    }

    if (!isWorkerResponse(response)) {
      throw new Error(
        `Invalid response from lib benchmark worker: ${next.value}`,
      )
    }
    if ('error' in response) {
      throw new Error(`Lib benchmark worker failed: ${response.error}`)
    }
    return response.timeMs
  }

  let closed = false
  return {
    run: async (count = 1) => {
      if (!child.stdin.writable || child.stdin.destroyed) {
        throw new Error('Lib benchmark worker is not running')
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

      const exitCode = await waitForExit(5_000)
      responseLines.close()
      if (exitCode !== 0) {
        throw new Error(
          `Lib benchmark worker exited with code ${exitCode ?? 'unknown'}${stderr ? `: ${stderr}` : ''}`,
        )
      }
    },
  }
}

const runCase = async ({
  caseId,
  name,
  config,
  baseWorktree,
  headOutputDir,
  baseOutputDir,
}: {
  caseId: LibBenchmarkCaseId
  name: string
  config: Config
  baseWorktree?: string
  headOutputDir: string
  baseOutputDir: string
}) => {
  writeSection(`Benchmark: ${name}`)
  preflightBuiltArtifacts(repositoryRoot)
  if (baseWorktree) {
    preflightBuiltArtifacts(baseWorktree)
  }

  let headWorker: LibWorker | undefined
  let baseWorker: LibWorker | undefined
  const baseTimes: number[] = []
  const headTimes: number[] = []

  const runFor = async (worker: LibWorker, times: number[]) => {
    if (times.length < config.runs) {
      times.push(await worker.run())
    }
  }

  let runFailed = false
  let closeFailure: { error: unknown } | undefined
  try {
    const activeHeadWorker = startWorker({
      cwd: repositoryRoot,
      caseId,
      repeat: config.repeat,
      responseTimeoutMs: config.responseTimeoutMs,
    })
    headWorker = activeHeadWorker
    const activeBaseWorker = baseWorktree
      ? startWorker({
          cwd: baseWorktree,
          caseId,
          repeat: config.repeat,
          responseTimeoutMs: config.responseTimeoutMs,
        })
      : undefined
    baseWorker = activeBaseWorker

    for (let i = 0; i < config.warmup; i++) {
      if (activeBaseWorker && i % 2 === 1) {
        await activeBaseWorker.run()
        await activeHeadWorker.run()
      } else {
        await activeHeadWorker.run()
        if (activeBaseWorker) {
          await activeBaseWorker.run()
        }
      }
    }

    // Use an ABBA sequence so gradual machine drift affects both revisions
    // equally. Each pair contributes two samples to each revision.
    const pairs = Math.ceil(config.runs / 2)
    for (let pair = 0; pair < pairs; pair++) {
      const order =
        pair % 2 === 0
          ? (['base', 'head', 'head', 'base'] as const)
          : (['head', 'base', 'base', 'head'] as const)
      for (const side of order) {
        if (side === 'base' && activeBaseWorker) {
          await runFor(activeBaseWorker, baseTimes)
        } else if (side === 'head') {
          await runFor(activeHeadWorker, headTimes)
        }
      }
    }
  } catch (error) {
    runFailed = true
    throw error
  } finally {
    const closeResults = await Promise.allSettled(
      [headWorker, baseWorker]
        .filter((worker): worker is LibWorker => worker !== undefined)
        .map((worker) => worker.close()),
    )
    if (!runFailed) {
      const closeError = closeResults.find(
        (result) => result.status === 'rejected',
      )
      if (closeError?.status === 'rejected') {
        closeFailure = { error: closeError.reason }
      }
    }
  }

  if (closeFailure) {
    throw closeFailure.error
  }

  if (headTimes.length !== config.runs) {
    throw new Error(
      `Benchmark ${caseId} did not collect the requested number of samples`,
    )
  }
  if (!hasInformativeTimingSamples(headTimes)) {
    throw new Error(`Benchmark ${caseId} returned invalid timing samples`)
  }

  if (baseWorker) {
    if (baseTimes.length !== config.runs) {
      throw new Error(
        `Benchmark ${caseId} did not collect the requested number of base samples`,
      )
    }
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

  await Bun.write(
    join(headOutputDir, `${caseId}.json`),
    `${JSON.stringify(
      { caseId, repeat: config.repeat, timesMs: headTimes },
      null,
      2,
    )}\n`,
  )
  if (baseWorker) {
    await Bun.write(
      join(baseOutputDir, `${caseId}.json`),
      `${JSON.stringify(
        { caseId, repeat: config.repeat, timesMs: baseTimes },
        null,
        2,
      )}\n`,
    )
  }

  return {
    id: caseId,
    name,
    mode: isAATest ? 'a/a' : 'comparison',
    ...summary,
  }
}

export type LibBenchmarkCaseResult = Awaited<ReturnType<typeof runCase>>

/**
 * Per-call lib timings routinely sit below 0.01 ms, where `formatMs` rounds
 * everything to `0.00 ms`. Render those in microseconds so tables stay
 * auditable instead of showing `0.00 / 0.00` next to a nonzero delta.
 */
export const formatPreciseMs = (value: number) => {
  if (Number.isFinite(value) && value !== 0 && Math.abs(value) < 0.01) {
    return `${(value * 1000).toFixed(2)} µs`
  }
  return formatMs(value)
}

export const buildMarkdownReport = ({
  config,
  results,
}: {
  config: Config
  results: LibBenchmarkCaseResult[]
}) => {
  const hasRegressions = results.some(
    (result) => result.timeStatus === 'regression',
  )
  const hasInconclusive = results.some(
    (result) => result.timeStatus === 'inconclusive',
  )
  const hasNotableChanges =
    hasRegressions ||
    hasInconclusive ||
    results.some((result) => result.timeStatus === 'improvement')
  // When every case is 1:1 or stable the report collapses to a one-liner so
  // the PR comment stays noise-free. The full per-case data remains available
  // in the JSON report and uploaded artifacts.
  if (results.length > 0 && !hasNotableChanges) {
    return [
      '## ⚡ Nordcraft Lib Performance Benchmark',
      '',
      `✅ No change – lib performance is 1:1 with base (${results.length} cases).`,
      '',
    ].join('\n')
  }
  return [
    '## ⚡ Nordcraft Lib Performance Benchmark',
    '',
    `- **Runs**: ${config.runs} (plus ${config.warmup} warmups)`,
    `- **Base ref**: ${config.baseRef ?? 'head-only'}`,
    `- **Noise & Equivalence Threshold**: ±${config.noiseThresholdPercent.toFixed(1)}% (noise or statistically indistinguishable deltas are reported as 1:1)`,
    `- **Allowed Regression Threshold**: ${config.maxRegressionPercent.toFixed(1)}% and ${config.maxRegressionMs.toFixed(2)} ms`,
    `- **Measurement**: interleaved Bun worker trials, ${config.repeat} executions per sample`,
    `- **Worker response deadline**: ${config.responseTimeoutMs} ms`,
    `- **Bootstrap**: ${config.bootstrapIterations} iterations, seed ${config.bootstrapSeed}`,
    `- **Mode**: ${config.baseRef ? 'base/head comparison' : 'A/A (head-only; no independent base)'}`,
    `- **Cases**: ${results.length} std-lib functions`,
    '',
    hasRegressions
      ? '> ⚠️ **Warning**: Performance regression detected above threshold in one or more scenarios.'
      : hasInconclusive
        ? '> ⚠️ **Warning**: One or more scenarios were inconclusive because their timing samples were invalid or degenerate.'
        : '> ✅ **No regressions detected**. Lib performance is 1:1, stable, or improved.',
    '',
    '| Case | Base median (IQR) | Head median (IQR) | Delta | 95% CI | p-value | Verdict |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | :---: |',
    ...results.map((result) => {
      const base = `${formatPreciseMs(result.baseMedianMs)} (${formatPreciseMs(result.baseIqrMs)})`
      const head = `${formatPreciseMs(result.headMedianMs)} (${formatPreciseMs(result.headIqrMs)})`
      const delta = `${formatPercent(result.deltaPercent)} (${formatPreciseMs(result.deltaMs)})`
      const ci = `${formatPercent(result.ciLowPercent)} / ${formatPercent(result.ciHighPercent)}`
      return `| **${result.id}** | ${base} | ${head} | ${delta} | ${ci} | ${result.pValue.toExponential(2)} | ${result.timeVerdict} |`
    }),
    '',
  ].join('\n')
}

const writeReport = async ({
  config,
  results,
  markdownPath,
  jsonPath,
}: {
  config: Config
  results: Array<Awaited<ReturnType<typeof runCase>>>
  markdownPath: string
  jsonPath: string
}) => {
  const hasRegressions = results.some(
    (result) => result.timeStatus === 'regression',
  )
  const hasInconclusive = results.some(
    (result) => result.timeStatus === 'inconclusive',
  )
  const markdown = buildMarkdownReport({ config, results })

  mkdirSync(dirname(markdownPath), { recursive: true })
  mkdirSync(dirname(jsonPath), { recursive: true })
  await Bun.write(markdownPath, `${markdown}\n`)
  await Bun.write(
    jsonPath,
    `${JSON.stringify(
      {
        status: hasRegressions
          ? 'regression'
          : hasInconclusive
            ? 'inconclusive'
            : 'pass',
        config: {
          baseRef: config.baseRef ?? null,
          runs: config.runs,
          warmup: config.warmup,
          repeat: config.repeat,
          noiseThresholdPercent: config.noiseThresholdPercent,
          maxRegressionPercent: config.maxRegressionPercent,
          maxRegressionMs: config.maxRegressionMs,
          responseTimeoutMs: config.responseTimeoutMs,
          bootstrapIterations: config.bootstrapIterations,
          bootstrapSeed: config.bootstrapSeed,
          failOnRegression: config.failOnRegression,
        },
        results,
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    '\n==================================== LIB BENCHMARK RESULTS ====================================',
  )
  console.log(
    'Case'.padEnd(30) +
      'Base/Head median'.padStart(22) +
      'Delta'.padStart(18) +
      '  Verdict',
  )
  console.log('-'.repeat(100))
  for (const result of results) {
    console.log(
      result.id.padEnd(30) +
        `${formatPreciseMs(result.baseMedianMs)} / ${formatPreciseMs(result.headMedianMs)}`.padStart(
          22,
        ) +
        `${formatPercent(result.deltaPercent)} (${formatPreciseMs(result.deltaMs)})`.padStart(
          22,
        ) +
        `  ${result.timeVerdict}`,
    )
  }
  console.log(
    '===========================================================================================\n',
  )
  console.log(`Markdown report written to: ${markdownPath}`)
  console.log(`JSON report written to: ${jsonPath}`)

  if (hasRegressions && config.failOnRegression) {
    const regressions = results
      .filter((result) => result.timeStatus === 'regression')
      .map(
        (result) =>
          `${result.name}: ${formatPercent(result.deltaPercent)}, ${formatPreciseMs(result.deltaMs)}`,
      )
      .join(', ')
    throw new Error(`Lib benchmark regression above threshold: ${regressions}`)
  }
}

export const main = async (
  argv: readonly string[] = Bun.argv.slice(2),
  overrides?: Partial<Config>,
) => {
  const parsed = parseConfig(argv)
  const config: Config = { ...parsed, ...overrides }
  const outputRoot = config.outputDir
    ? resolve(repositoryRoot, config.outputDir)
    : await mkdtemp(join(tmpdir(), 'nordcraft-lib-bench-'))
  const headOutputDir = join(outputRoot, 'head')
  const baseOutputDir = join(outputRoot, 'base')
  const baseWorktreePath = join(outputRoot, 'base-worktree')
  if (config.outputDir && !config.baseRef) {
    removeBenchmarkWorktree(baseWorktreePath)
  }
  if (config.outputDir) {
    rmSync(headOutputDir, { recursive: true, force: true })
    rmSync(baseOutputDir, { recursive: true, force: true })
  }
  mkdirSync(headOutputDir, { recursive: true })
  mkdirSync(baseOutputDir, { recursive: true })

  console.log('== Nordcraft Lib Performance Benchmark ==')
  console.log(
    `Configuration: runs=${config.runs}, warmup=${config.warmup}, repeat=${config.repeat}, threshold=±${config.noiseThresholdPercent}%`,
  )

  let baseWorktree: string | undefined
  let worktreeCreated = false
  try {
    if (!config.skipBuild) {
      writeSection('Building current checkout')
      runCommand(['bun', 'run', 'build'], { cwd: repositoryRoot })
    }

    if (config.baseRef) {
      const activeBaseWorktree = baseWorktreePath
      baseWorktree = activeBaseWorktree
      writeSection(`Preparing base worktree (${config.baseRef})`)
      removeBenchmarkWorktree(activeBaseWorktree)
      worktreeCreated = true
      runCommand(['git', 'worktree', 'add', activeBaseWorktree, config.baseRef])
      copyBenchmarkAssets(activeBaseWorktree)

      if (!config.skipBuild) {
        writeSection('Installing and building base worktree')
        runCommand(['bun', 'install', '--frozen-lockfile'], {
          cwd: baseWorktree,
        })
        runCommand(['bun', 'run', 'build'], { cwd: baseWorktree })
      }
    }

    const casesToRun = resolveCasesToRun({
      caseId: config.caseId,
      includeSkipped: config.includeSkipped,
    })
    if (!config.caseId && casesToRun.length < LIB_BENCHMARK_CASES.length) {
      console.log(
        `Skipping ${LIB_BENCHMARK_CASES.length - casesToRun.length} thin-passthrough cases (use --include-skipped=true or --case=<id> to run them)`,
      )
    }
    const results = []
    for (const benchmarkCase of casesToRun) {
      results.push(
        await runCase({
          caseId: benchmarkCase.id,
          name: benchmarkCase.name,
          config,
          baseWorktree,
          headOutputDir,
          baseOutputDir,
        }),
      )
    }

    const markdownPath = config.exportMarkdown
      ? resolve(repositoryRoot, config.exportMarkdown)
      : join(outputRoot, 'lib-benchmark-report.md')
    const jsonPath = config.exportJson
      ? resolve(repositoryRoot, config.exportJson)
      : join(outputRoot, 'lib-benchmark-report.json')
    await writeReport({
      config,
      results,
      markdownPath,
      jsonPath,
    })
  } finally {
    if (baseWorktree && worktreeCreated) {
      if (config.keepWorktree && existsSync(baseWorktree)) {
        console.log(`Base worktree kept at: ${baseWorktree}`)
      } else {
        removeBenchmarkWorktree(baseWorktree)
      }
    }
  }

  console.log(`\nHead benchmark outputs: ${headOutputDir}`)
  if (baseWorktree) {
    console.log(`Base benchmark outputs: ${baseOutputDir}`)
  }
  console.log(`Benchmark output directory: ${outputRoot}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Lib benchmark execution failed:', error)
    process.exit(1)
  })
}
