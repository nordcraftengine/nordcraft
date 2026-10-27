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
  loadFixtureSerializationResults,
  renderFixtureSerializationTable,
  type FixtureMode,
  type FixtureSerializationResult,
} from '../benchmarks/fixtureCompression'
import {
  SSR_BENCHMARK_CASES,
  type SsrBenchmarkCaseId,
} from '../benchmarks/ssrCases'
import {
  evaluateHeapVerdict,
  formatKb,
  formatMs,
  formatPercent,
  hasInformativeTimingSamples,
  median,
  summarizeTimeBenchmark,
} from '../benchmarks/stats'

export type Config = {
  baseRef?: string
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
  compareFixtures?: boolean
  outputDir?: string
  keepWorktree: boolean
  exportJson?: string
  exportMarkdown?: string
}

export type SsrBenchmarkSample = {
  timeMs: number
  heapDeltaKb: number
}

export type WorkerResponse = SsrBenchmarkSample | { error: string }

type SsrWorker = {
  run: (count?: number) => Promise<SsrBenchmarkSample>
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
  const config: Config = {
    baseRef,
    runs: getPositiveInteger(args, '--runs', 20),
    warmup: getNonNegativeInteger(args, '--warmup', 4),
    repeat: getPositiveInteger(args, '--repeat', 1),
    noiseThresholdPercent: getNumber(args, '--noise-threshold-percent', 1.5),
    maxRegressionPercent: getNumber(args, '--max-regression-percent', 3.0),
    maxRegressionMs: getNumber(args, '--max-regression-ms', 1.0),
    responseTimeoutMs: getNumber(args, '--response-timeout-ms', 120_000),
    bootstrapIterations: getPositiveInteger(
      args,
      '--bootstrap-iterations',
      1000,
    ),
    bootstrapSeed: getNumber(args, '--bootstrap-seed', 0),
    failOnRegression: getBoolean(args, '--fail-on-regression', true),
    skipBuild: getBoolean(args, '--skip-build', false),
    compareFixtures: getBoolean(args, '--compare-fixtures', false),
    outputDir: getOptionalString(args, '--output-dir'),
    keepWorktree: getBoolean(args, '--keep-worktree', false),
    exportJson: getOptionalString(args, '--export-json'),
    exportMarkdown: getOptionalString(args, '--export-markdown'),
  }

  if (config.baseRef && config.skipBuild && !config.compareFixtures) {
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
    'bin/ssrBenchmark.ts',
    'benchmarks/cli.ts',
    'benchmarks/fixtureCompression.ts',
    'benchmarks/ssrCases.ts',
    'benchmarks/browser/fixtures/benchmark-project.json',
    'benchmarks/browser/fixtures/nordcraft.com.json',
  ]

  for (const asset of assets) {
    const source = resolve(repositoryRoot, asset)
    const destination = join(worktree, asset)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(source, destination)
  }
}

const preflightBuiltArtifacts = (cwd: string) => {
  const requiredArtifacts = [
    'packages/core/dist/formula/formula.js',
    'packages/ssr/dist/components/utils.js',
    'packages/ssr/dist/rendering/components.js',
    'packages/ssr/dist/rendering/formulaContext.js',
  ]
  const missing = requiredArtifacts.filter(
    (artifact) => !existsSync(resolve(cwd, artifact)),
  )
  if (missing.length > 0) {
    throw new Error(
      `Missing built SSR benchmark artifacts in ${cwd}: ${missing.join(', ')}. Run 'bun run build' before benchmarking.`,
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
    value.timeMs > 0 &&
    'heapDeltaKb' in value &&
    typeof value.heapDeltaKb === 'number' &&
    Number.isFinite(value.heapDeltaKb) &&
    value.heapDeltaKb >= 0
  )
}

const startWorker = ({
  cwd,
  caseId,
  repeat,
  responseTimeoutMs,
  fixtures = 'raw',
}: {
  cwd: string
  caseId: SsrBenchmarkCaseId
  repeat: number
  responseTimeoutMs: number
  fixtures?: FixtureMode
}): SsrWorker => {
  const child = spawn(
    'bun',
    [
      'bin/ssrBenchmark.ts',
      `--case=${caseId}`,
      `--repeat=${repeat}`,
      `--worker=true`,
      `--fixtures=${fixtures}`,
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
            `SSR benchmark worker response timed out after ${responseTimeoutMs}ms${stderr ? `: ${stderr}` : ''}`,
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
        `SSR benchmark worker exited before returning a result (${exitCode ?? 'unknown'})${stderr ? `: ${stderr}` : ''}`,
      )
    }

    let response: unknown
    try {
      response = JSON.parse(next.value) as unknown
    } catch (error) {
      throw new Error(
        `Invalid response from SSR benchmark worker: ${next.value}`,
        { cause: error },
      )
    }

    if (!isWorkerResponse(response)) {
      throw new Error(
        `Invalid response from SSR benchmark worker: ${next.value}`,
      )
    }
    if ('error' in response) {
      throw new Error(`SSR benchmark worker failed: ${response.error}`)
    }
    return response
  }

  let closed = false
  return {
    run: async (count = 1) => {
      if (!child.stdin.writable || child.stdin.destroyed) {
        const exitCode = await waitForExit(1_000)
        throw new Error(
          `SSR benchmark worker is not running (${exitCode ?? 'unknown'})${stderr ? `: ${stderr}` : ''}`,
        )
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
          `SSR benchmark worker exited with code ${exitCode ?? 'unknown'}${stderr ? `: ${stderr}` : ''}`,
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
  fixtureModes,
  headOutputDir,
  baseOutputDir,
}: {
  caseId: SsrBenchmarkCaseId
  name: string
  config: Config
  baseWorktree?: string
  fixtureModes?: { base: FixtureMode; head: FixtureMode }
  headOutputDir: string
  baseOutputDir: string
}) => {
  writeSection(`Benchmark: ${name}`)
  preflightBuiltArtifacts(repositoryRoot)
  if (baseWorktree) {
    preflightBuiltArtifacts(baseWorktree)
  }
  const hasBase = Boolean(baseWorktree ?? fixtureModes)

  let headWorker: SsrWorker | undefined
  let baseWorker: SsrWorker | undefined
  const baseSamples: SsrBenchmarkSample[] = []
  const headSamples: SsrBenchmarkSample[] = []

  const runFor = async (worker: SsrWorker, samples: SsrBenchmarkSample[]) => {
    if (samples.length < config.runs) {
      samples.push(await worker.run())
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
      fixtures: fixtureModes?.head ?? 'raw',
    })
    headWorker = activeHeadWorker
    const activeBaseWorker = hasBase
      ? startWorker({
          cwd: baseWorktree ?? repositoryRoot,
          caseId,
          repeat: config.repeat,
          responseTimeoutMs: config.responseTimeoutMs,
          fixtures: fixtureModes?.base ?? 'raw',
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
          await runFor(activeBaseWorker, baseSamples)
        } else if (side === 'head') {
          await runFor(activeHeadWorker, headSamples)
        }
      }
    }
  } catch (error) {
    runFailed = true
    throw error
  } finally {
    const closeResults = await Promise.allSettled(
      [headWorker, baseWorker]
        .filter((worker): worker is SsrWorker => worker !== undefined)
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

  if (headSamples.length !== config.runs) {
    throw new Error(
      `Benchmark ${caseId} did not collect the requested number of samples`,
    )
  }
  if (!hasInformativeTimingSamples(headSamples.map(({ timeMs }) => timeMs))) {
    throw new Error(`Benchmark ${caseId} returned invalid timing samples`)
  }
  if (
    headSamples.some(
      ({ heapDeltaKb }) => !Number.isFinite(heapDeltaKb) || heapDeltaKb < 0,
    )
  ) {
    throw new Error(`Benchmark ${caseId} returned invalid heap samples`)
  }

  if (baseWorker) {
    if (baseSamples.length !== config.runs) {
      throw new Error(
        `Benchmark ${caseId} did not collect the requested number of base samples`,
      )
    }
    if (!hasInformativeTimingSamples(baseSamples.map(({ timeMs }) => timeMs))) {
      throw new Error(
        `Benchmark ${caseId} returned invalid base timing samples`,
      )
    }
    if (
      baseSamples.some(
        ({ heapDeltaKb }) => !Number.isFinite(heapDeltaKb) || heapDeltaKb < 0,
      )
    ) {
      throw new Error(`Benchmark ${caseId} returned invalid base heap samples`)
    }
  } else {
    baseSamples.push(...headSamples)
  }

  const baseTimes = baseSamples.map(({ timeMs }) => timeMs)
  const headTimes = headSamples.map(({ timeMs }) => timeMs)
  const baseHeaps = baseSamples.map(({ heapDeltaKb }) => heapDeltaKb)
  const headHeaps = headSamples.map(({ heapDeltaKb }) => heapDeltaKb)

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

  const baseHeapMedianKb = median(baseHeaps)
  const headHeapMedianKb = median(headHeaps)
  const deltaHeapKb = headHeapMedianKb - baseHeapMedianKb
  const deltaHeapPercent =
    baseHeapMedianKb > 0 ? (deltaHeapKb / baseHeapMedianKb) * 100 : 0
  const heapResult = evaluateHeapVerdict({
    isByteIdentical: false,
    deltaHeapPercent,
    deltaHeapKb,
    noiseThresholdPercent: config.noiseThresholdPercent,
  })

  await Bun.write(
    join(headOutputDir, `${caseId}.json`),
    `${JSON.stringify(
      { caseId, repeat: config.repeat, timesMs: headTimes, heapsKb: headHeaps },
      null,
      2,
    )}\n`,
  )
  if (baseWorker) {
    await Bun.write(
      join(baseOutputDir, `${caseId}.json`),
      `${JSON.stringify(
        {
          caseId,
          repeat: config.repeat,
          timesMs: baseTimes,
          heapsKb: baseHeaps,
        },
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
    baseHeaps,
    headHeaps,
    baseHeapMedianKb,
    headHeapMedianKb,
    deltaHeapKb,
    deltaHeapPercent,
    heapStatus: heapResult.status,
    heapVerdict: heapResult.verdict,
  }
}

export const SSR_CLEAN_MARKDOWN =
  '✅ SSR Benchmark: No regressions or improvements — performance and memory are 1:1.'

export const isSsrClean = (
  results: ReadonlyArray<{ timeStatus: string; heapStatus: string }>,
) =>
  results.length > 0 &&
  results.every(
    (result) =>
      (result.timeStatus === '1:1' || result.timeStatus === 'stable') &&
      (result.heapStatus === '1:1' || result.heapStatus === 'stable'),
  )

export const renderSsrMarkdown = ({
  config,
  results,
  fixtures,
}: {
  config: Config
  results: Array<Awaited<ReturnType<typeof runCase>>>
  fixtures?: FixtureSerializationResult[]
}) => {
  const isFixtureComparison = config.compareFixtures === true
  if (!isFixtureComparison && isSsrClean(results)) {
    return SSR_CLEAN_MARKDOWN
  }
  const hasRegressions = results.some(
    (result) =>
      result.timeStatus === 'regression' || result.heapStatus === 'regression',
  )
  const hasInconclusive = results.some(
    (result) => result.timeStatus === 'inconclusive',
  )
  const lines = [
    isFixtureComparison
      ? '## 🧪 Nordcraft SSR Test Data Impact Benchmark'
      : '## ⚡ Nordcraft SSR Performance Benchmark',
    '',
    `- **Runs**: ${config.runs} (plus ${config.warmup} warmups)`,
    ...(isFixtureComparison
      ? [
          '- **Base**: project fixtures with editor-only test data',
          '- **Head**: project fixtures after `removeTestData` sanitation',
          '- **Mode**: raw vs. compressed fixture comparison',
        ]
      : [
          `- **Base ref**: ${config.baseRef ?? 'head-only'}`,
          `- **Mode**: ${config.baseRef ? 'base/head comparison' : 'A/A (head-only; no independent base)'}`,
        ]),
    `- **Noise & Equivalence Threshold**: ±${config.noiseThresholdPercent.toFixed(1)}% (noise or statistically indistinguishable deltas are reported as 1:1)`,
    `- **Allowed Regression Threshold**: ${config.maxRegressionPercent.toFixed(1)}% and ${config.maxRegressionMs.toFixed(2)} ms`,
    `- **Measurement**: interleaved Bun worker trials${config.repeat > 1 ? `, ${config.repeat} executions per sample` : ''}`,
    `- **Heap measurement**: forced GC before and after each sample, reported as retained heap delta per execution`,
    `- **Worker response deadline**: ${config.responseTimeoutMs} ms`,
    `- **Bootstrap**: ${config.bootstrapIterations} iterations, seed ${config.bootstrapSeed}`,
    '',
    hasRegressions
      ? '> ⚠️ **Warning**: Performance or memory regression detected above threshold in one or more scenarios.'
      : hasInconclusive
        ? '> ⚠️ **Warning**: One or more scenarios were inconclusive because their timing samples were invalid or degenerate.'
        : '> ✅ **No regressions detected**. SSR performance and memory are 1:1, stable, or improved.',
    '',
  ]

  if (isFixtureComparison && fixtures?.length) {
    lines.push(
      '### Fixture payload size',
      '',
      ...renderFixtureSerializationTable(fixtures),
      '',
    )
  }

  lines.push(
    '| Case | Base median (IQR) | Head median (IQR) | Delta | 95% CI | p-value | Time Verdict | Base/Head heap | Heap Delta | Heap Verdict |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | :---: | ---: | ---: | :---: |',
    ...results.map((result) => {
      const base = `${formatMs(result.baseMedianMs)} (${formatMs(result.baseIqrMs)})`
      const head = `${formatMs(result.headMedianMs)} (${formatMs(result.headIqrMs)})`
      const delta = `${formatPercent(result.deltaPercent)} (${formatMs(result.deltaMs)})`
      const ci = `${formatPercent(result.ciLowPercent)} / ${formatPercent(result.ciHighPercent)}`
      const heap = `${formatKb(result.baseHeapMedianKb)} / ${formatKb(result.headHeapMedianKb)}`
      const heapDelta = `${result.deltaHeapKb >= 0 ? '+' : ''}${formatKb(result.deltaHeapKb)} (${formatPercent(result.deltaHeapPercent)})`
      return `| **${result.id}** | ${base} | ${head} | ${delta} | ${ci} | ${result.pValue.toExponential(2)} | ${result.timeVerdict} | ${heap} | ${heapDelta} | ${result.heapVerdict} |`
    }),
    '',
  )

  return lines.join('\n')
}

const writeReport = async ({
  config,
  results,
  fixtures,
  markdownPath,
  jsonPath,
}: {
  config: Config
  results: Array<Awaited<ReturnType<typeof runCase>>>
  fixtures?: FixtureSerializationResult[]
  markdownPath: string
  jsonPath: string
}) => {
  const hasRegressions = results.some(
    (result) =>
      result.timeStatus === 'regression' || result.heapStatus === 'regression',
  )
  const hasInconclusive = results.some(
    (result) => result.timeStatus === 'inconclusive',
  )
  const markdown = renderSsrMarkdown({ config, results, fixtures })

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
          compareFixtures: config.compareFixtures ?? false,
        },
        fixtures,
        results,
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    '\n==================================== SSR BENCHMARK RESULTS ====================================',
  )
  console.log(
    'Case'.padEnd(30) +
      'Base/Head time'.padStart(22) +
      'Delta'.padStart(18) +
      '  Time verdict'.padEnd(24) +
      'Base/Head heap'.padStart(21) +
      'Heap delta'.padStart(18) +
      '  Heap verdict',
  )
  console.log('-'.repeat(150))
  for (const result of results) {
    console.log(
      result.id.padEnd(30) +
        `${formatMs(result.baseMedianMs)} / ${formatMs(result.headMedianMs)}`.padStart(
          22,
        ) +
        `${formatPercent(result.deltaPercent)} (${formatMs(result.deltaMs)})`.padStart(
          18,
        ) +
        '  ' +
        result.timeVerdict.padEnd(22) +
        `${formatKb(result.baseHeapMedianKb)} / ${formatKb(result.headHeapMedianKb)}`.padStart(
          21,
        ) +
        `${result.deltaHeapKb >= 0 ? '+' : ''}${formatKb(result.deltaHeapKb)} (${formatPercent(result.deltaHeapPercent)})`.padStart(
          18,
        ) +
        '  ' +
        result.heapVerdict,
    )
  }
  console.log(
    '===========================================================================================\n',
  )
  console.log(`Markdown report written to: ${markdownPath}`)
  console.log(`JSON report written to: ${jsonPath}`)

  if (hasRegressions && config.failOnRegression) {
    const regressions = results
      .filter(
        (result) =>
          result.timeStatus === 'regression' ||
          result.heapStatus === 'regression',
      )
      .map((result) => {
        const details: string[] = []
        if (result.timeStatus === 'regression') {
          details.push(
            `time ${formatPercent(result.deltaPercent)}, ${formatMs(result.deltaMs)}`,
          )
        }
        if (result.heapStatus === 'regression') {
          details.push(
            `heap ${formatPercent(result.deltaHeapPercent)}, ${formatKb(result.deltaHeapKb)}`,
          )
        }
        return `${result.name}: ${details.join(', ')}`
      })
      .join(', ')
    throw new Error(`SSR benchmark regression above threshold: ${regressions}`)
  }
}

const main = async () => {
  const config = parseConfig()
  const outputRoot = config.outputDir
    ? resolve(repositoryRoot, config.outputDir)
    : await mkdtemp(join(tmpdir(), 'nordcraft-ssr-bench-'))
  const headOutputDir = join(outputRoot, 'head')
  const baseOutputDir = join(outputRoot, 'base')
  const baseWorktreePath = join(outputRoot, 'base-worktree')
  if (config.outputDir && (!config.baseRef || config.compareFixtures)) {
    removeBenchmarkWorktree(baseWorktreePath)
  }
  if (config.outputDir) {
    rmSync(headOutputDir, { recursive: true, force: true })
    rmSync(baseOutputDir, { recursive: true, force: true })
  }
  mkdirSync(headOutputDir, { recursive: true })
  mkdirSync(baseOutputDir, { recursive: true })

  if (config.compareFixtures) {
    console.log('== Nordcraft SSR Test Data Impact Benchmark ==')
    if (config.baseRef) {
      console.log(
        `Comparing raw and compressed fixtures in the current checkout; ignoring --base-ref=${config.baseRef}`,
      )
    }
  } else {
    console.log('== Nordcraft SSR Performance Benchmark ==')
  }
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

    if (config.baseRef && !config.compareFixtures) {
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

    const fixtureModes = config.compareFixtures
      ? ({ base: 'raw', head: 'compressed' } as const)
      : undefined
    const benchmarkCases = config.compareFixtures
      ? SSR_BENCHMARK_CASES.filter(({ id }) => id !== 'formula')
      : SSR_BENCHMARK_CASES
    const results = []
    for (const benchmarkCase of benchmarkCases) {
      results.push(
        await runCase({
          caseId: benchmarkCase.id,
          name: benchmarkCase.name,
          config,
          baseWorktree,
          fixtureModes,
          headOutputDir,
          baseOutputDir,
        }),
      )
    }

    const fixtures = config.compareFixtures
      ? await loadFixtureSerializationResults()
      : undefined

    const markdownPath = config.exportMarkdown
      ? resolve(repositoryRoot, config.exportMarkdown)
      : join(outputRoot, 'ssr-benchmark-report.md')
    const jsonPath = config.exportJson
      ? resolve(repositoryRoot, config.exportJson)
      : join(outputRoot, 'ssr-benchmark-report.json')
    await writeReport({
      config,
      results,
      fixtures,
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
  if (baseWorktree || config.compareFixtures) {
    console.log(`Base benchmark outputs: ${baseOutputDir}`)
  }
  console.log(`Benchmark output directory: ${outputRoot}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('SSR benchmark execution failed:', error)
    process.exit(1)
  })
}
