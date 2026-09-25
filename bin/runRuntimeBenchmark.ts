/* eslint-disable no-console */
import { spawnSync } from 'child_process'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { chromium, type Browser, type Page } from 'playwright'
import { fileURLToPath } from 'url'
import { startBenchmarkServer } from '../benchmarks/browser/server'
import {
  getBoolean,
  getNonNegativeInteger,
  getNumber,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  computeSha256,
  evaluateHeapVerdict,
  formatKb,
  formatMs,
  formatPercent,
  hasInformativeTimingSamples,
  median,
  summarizeTimeBenchmark,
} from '../benchmarks/stats'

interface RunCaseResult {
  timeMs: number
  heapDeltaKb: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isRunCaseResult = (value: unknown): value is RunCaseResult =>
  isRecord(value) &&
  typeof value.timeMs === 'number' &&
  Number.isFinite(value.timeMs) &&
  value.timeMs > 0 &&
  typeof value.heapDeltaKb === 'number' &&
  Number.isFinite(value.heapDeltaKb) &&
  value.heapDeltaKb >= 0

const runInPage = async (page: Page, caseId: string) => {
  const result = await page.evaluate(async (id) => {
    const runCase = (
      window as Window & {
        __runCase?: (caseId: string) => Promise<unknown>
      }
    ).__runCase
    if (!runCase) {
      throw new Error('Runtime harness is not initialized')
    }
    return runCase(id)
  }, caseId)
  if (!isRunCaseResult(result)) {
    throw new Error(
      `Runtime harness returned an invalid result for ${caseId}: ${JSON.stringify(result)}`,
    )
  }
  return result
}

interface BenchmarkCaseResult {
  id: string
  name: string
  isByteIdentical: boolean
  baseTimes: number[]
  headTimes: number[]
  baseHeaps: number[]
  headHeaps: number[]
  baseMedianMs: number
  headMedianMs: number
  baseIqrMs: number
  headIqrMs: number
  deltaMs: number
  deltaPercent: number
  ciLowPercent: number
  ciHighPercent: number
  pValue: number
  bootstrapIterations: number
  bootstrapSeed: number
  baseHeapMedianKb: number
  headHeapMedianKb: number
  deltaHeapKb: number
  deltaHeapPercent: number
  timeStatus: '1:1' | 'improvement' | 'regression' | 'stable' | 'inconclusive'
  timeVerdict: string
  heapStatus: '1:1' | 'improvement' | 'regression' | 'stable'
  heapVerdict: string
}

export const RUNTIME_BENCHMARK_CASES = [
  {
    id: 'mount-nordcraft',
    name: "mount-nordcraft (real nordcraft.com front page 'nordcraft': 213 components & 2.5k nodes)",
    bundles: ['page.main.esm.js'] as const,
  },
  {
    id: 'mount-pricing',
    name: "mount-pricing (real nordcraft.com 'pricing' page: 169 nodes, tables & formulas)",
    bundles: ['page.main.esm.js'] as const,
  },
  {
    id: 'reactive-clicks',
    name: 'reactive-clicks (2k click events, actions & signal updates)',
    bundles: ['page.main.esm.js'] as const,
  },
  {
    id: 'list-repeat',
    name: 'list-repeat (15 cycles: 200 items populate & clear)',
    bundles: ['page.main.esm.js'] as const,
  },
  {
    id: 'custom-element',
    name: 'custom-element (define & mount 200 custom elements)',
    bundles: ['page.main.esm.js', 'custom-element.main.esm.js'] as const,
  },
] as const

export const areRuntimeBundlesIdentical = (
  baseDistDir: string,
  headDistDir: string,
  bundles: readonly string[],
) =>
  bundles.every((bundle) => {
    const baseSha = computeSha256(path.join(baseDistDir, bundle))
    const headSha = computeSha256(path.join(headDistDir, bundle))
    return Boolean(baseSha && headSha && baseSha === headSha)
  })

export type RuntimeConfig = {
  baseRef?: string
  baseDir?: string
  headDir: string
  runs: number
  warmup: number
  maxRegressionPercent: number
  maxRegressionMs: number
  noiseThresholdPercent: number
  bootstrapIterations: number
  bootstrapSeed: number
  failOnRegression: boolean
  exportJson?: string
  exportMarkdown?: string
}

export const parseRuntimeConfig = (
  argv: readonly string[] = process.argv.slice(2),
): RuntimeConfig => {
  const args = parseBenchmarkArgs(argv)
  const baseRefArg = args.get('--base-ref')
  const baseRef =
    baseRefArg === undefined
      ? 'origin/main'
      : baseRefArg.length > 0
        ? baseRefArg
        : undefined
  const headDir = getOptionalString(args, '--head-dir')
  const baseDir = getOptionalString(args, '--base-dir')
  const config: RuntimeConfig = {
    baseRef,
    baseDir: baseDir === undefined ? undefined : path.resolve(baseDir),
    headDir: path.resolve(headDir ?? 'packages/runtime/dist'),
    runs: getPositiveInteger(args, '--runs', 20),
    warmup: getNonNegativeInteger(args, '--warmup', 4),
    maxRegressionPercent: getNumber(args, '--max-regression-percent', 3.0),
    maxRegressionMs: getNumber(args, '--max-regression-ms', 1.0),
    noiseThresholdPercent: getNumber(args, '--noise-threshold-percent', 1.5),
    bootstrapIterations: getPositiveInteger(
      args,
      '--bootstrap-iterations',
      1000,
    ),
    bootstrapSeed: getNumber(args, '--bootstrap-seed', 0),
    failOnRegression: getBoolean(args, '--fail-on-regression', true),
    exportJson: getOptionalString(args, '--export-json'),
    exportMarkdown: getOptionalString(args, '--export-markdown'),
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
  if (!Number.isInteger(config.bootstrapSeed)) {
    throw new Error('--bootstrap-seed must be an integer')
  }

  return config
}

const parseArgs = parseRuntimeConfig

type BaseArtifacts = {
  worktreePath: string
  distDir: string
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

async function prepareBaseWorktree(baseRef: string): Promise<BaseArtifacts> {
  const tmpDir = path.join(
    process.env.TMPDIR ?? '/tmp',
    `nordcraft-base-${Date.now()}-${process.pid}-${randomUUID()}`,
  )
  console.log(`Setting up base git worktree from ${baseRef} at ${tmpDir}...`)

  try {
    const addProc = spawnSync('git', ['worktree', 'add', tmpDir, baseRef], {
      cwd: repositoryRoot,
    })
    if (addProc.status !== 0) {
      throw new Error(
        `Failed to create worktree: ${addProc.stderr?.toString().trim() || `exit code ${addProc.status}`}`,
      )
    }

    console.log(`Installing dependencies in base worktree...`)
    const installProc = spawnSync('bun', ['install', '--frozen-lockfile'], {
      cwd: tmpDir,
    })
    if (installProc.status !== 0) {
      throw new Error(
        `Failed to install base dependencies: ${installProc.stderr?.toString().trim() || `exit code ${installProc.status}`}`,
      )
    }

    console.log(`Building runtime packages in base worktree...`)
    const buildProc = spawnSync('bun', ['run', 'build'], { cwd: tmpDir })
    if (buildProc.status !== 0) {
      throw new Error(
        `Failed to build base packages: ${buildProc.stderr?.toString().trim() || `exit code ${buildProc.status}`}`,
      )
    }
    return {
      worktreePath: tmpDir,
      distDir: path.join(tmpDir, 'packages/runtime/dist'),
    }
  } catch (error) {
    cleanupWorktree(tmpDir)
    throw error
  }
}

function cleanupWorktree(worktreeDir: string) {
  if (!fs.existsSync(worktreeDir)) return
  try {
    const result = spawnSync(
      'git',
      ['worktree', 'remove', worktreeDir, '--force'],
      {
        cwd: repositoryRoot,
      },
    )
    if (result.status !== 0) {
      spawnSync('git', ['worktree', 'prune'], { cwd: repositoryRoot })
    }
  } finally {
    fs.rmSync(worktreeDir, { recursive: true, force: true })
  }
}

async function runBenchmark() {
  const config = parseArgs()
  console.log('== Nordcraft Runtime Performance Benchmark ==')
  console.log(
    `Configuration: runs=${config.runs}, warmup=${config.warmup}, threshold=±${config.noiseThresholdPercent}%`,
  )

  let baseDistDir = config.baseDir
  let createdWorktreePath: string | null = null
  let isAATest = false

  if (!baseDistDir) {
    if (config.baseRef) {
      const baseArtifacts = await prepareBaseWorktree(config.baseRef)
      createdWorktreePath = baseArtifacts.worktreePath
      baseDistDir = baseArtifacts.distDir
    } else {
      isAATest = true
      baseDistDir = config.headDir
      console.log(
        'Explicit A/A mode: comparing the head distribution to itself',
      )
    }
  }

  const results: BenchmarkCaseResult[] = []
  let server: ReturnType<typeof startBenchmarkServer> | undefined
  let browser: Browser | undefined
  let baseRuntimeBytes = 0
  let headRuntimeBytes = 0
  let isPageBundleIdentical = false
  try {
    const getFileSize = (filePath: string) => {
      try {
        if (fs.existsSync(filePath)) {
          return fs.statSync(filePath).size
        } else {
          throw new Error(`File does not exist: ${filePath}`)
        }
      } catch {
        throw new Error(`Failed to get file size for ${filePath}`)
      }
    }

    baseRuntimeBytes = getFileSize(path.join(baseDistDir, 'page.main.esm.js'))
    headRuntimeBytes = getFileSize(
      path.join(config.headDir, 'page.main.esm.js'),
    )
    const bundleIdentities = new Map<string, boolean>()
    for (const scenario of RUNTIME_BENCHMARK_CASES) {
      for (const bundle of scenario.bundles) {
        for (const [label, distDir] of [
          ['base', baseDistDir],
          ['head', config.headDir],
        ] as const) {
          const bundlePath = path.join(distDir, bundle)
          if (!fs.existsSync(bundlePath)) {
            throw new Error(
              `Missing ${label} runtime bundle for ${scenario.id}: ${bundlePath}`,
            )
          }
        }
        bundleIdentities.set(
          `${scenario.id}:${bundle}`,
          areRuntimeBundlesIdentical(baseDistDir, config.headDir, [bundle]),
        )
      }
    }

    const baseSha = computeSha256(path.join(baseDistDir, 'page.main.esm.js'))
    const headSha = computeSha256(path.join(config.headDir, 'page.main.esm.js'))
    if (!baseSha || !headSha) {
      throw new Error('Unable to hash the page runtime bundles')
    }
    isPageBundleIdentical = baseSha === headSha

    console.log(
      `Base bundle SHA: ${baseSha ? baseSha.slice(0, 10) : 'unknown'}`,
    )
    console.log(
      `Head bundle SHA: ${headSha ? headSha.slice(0, 10) : 'unknown'}`,
    )
    if (isPageBundleIdentical) {
      console.log(
        '✨ Note: The page runtime bundles are byte-for-byte identical',
      )
    }

    // Start local server
    server = startBenchmarkServer({
      baseDistDir,
      headDistDir: config.headDir,
    })
    if (!server) {
      throw new Error('Failed to start benchmark server')
    }
    const serverUrl = `http://localhost:${server.port}`
    console.log(`Benchmark server running at ${serverUrl}`)

    // Launch Chromium
    console.log('Launching headless Chromium with GC & timer stabilization...')
    browser = await chromium.launch({
      headless: true,
      args: [
        '--js-flags=--expose-gc',
        '--enable-precise-memory-info',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=CalculateNativeWinOcclusion',
        '--no-sandbox',
        '--disable-gpu',
      ],
    })
    if (!browser) {
      throw new Error('Failed to launch benchmark browser')
    }

    const baseContext = await browser.newContext()
    const headContext = await browser.newContext()

    const basePage = await baseContext.newPage()
    const headPage = await headContext.newPage()

    await Promise.all([
      basePage.goto(`${serverUrl}/harness.html?version=base`),
      headPage.goto(`${serverUrl}/harness.html?version=head`),
    ])

    await Promise.all([
      basePage.waitForFunction(
        () =>
          (window as Window & { __harnessReady?: boolean }).__harnessReady ===
          true,
      ),
      headPage.waitForFunction(
        () =>
          (window as Window & { __harnessReady?: boolean }).__harnessReady ===
          true,
      ),
    ])

    for (const scenario of RUNTIME_BENCHMARK_CASES) {
      console.log(`\nBenchmarking: ${scenario.name}`)

      // Warmup
      console.log(`  Warming up (${config.warmup} iterations)...`)
      for (let w = 0; w < config.warmup; w++) {
        await basePage.bringToFront()
        await runInPage(basePage, scenario.id)
        await headPage.bringToFront()
        await runInPage(headPage, scenario.id)
      }

      const baseTimes: number[] = []
      const headTimes: number[] = []
      const baseHeaps: number[] = []
      const headHeaps: number[] = []

      // Interleaved ABBA trials
      process.stdout.write(`  Running ${config.runs} trials: `)
      for (let r = 0; r < config.runs; r++) {
        process.stdout.write('.')
        const runBaseFirst = r % 2 === 0

        if (runBaseFirst) {
          await basePage.bringToFront()
          const rBase = await runInPage(basePage, scenario.id)
          await headPage.bringToFront()
          const rHead = await runInPage(headPage, scenario.id)
          baseTimes.push(rBase.timeMs)
          baseHeaps.push(rBase.heapDeltaKb)
          headTimes.push(rHead.timeMs)
          headHeaps.push(rHead.heapDeltaKb)
        } else {
          await headPage.bringToFront()
          const rHead = await runInPage(headPage, scenario.id)
          await basePage.bringToFront()
          const rBase = await runInPage(basePage, scenario.id)
          headTimes.push(rHead.timeMs)
          headHeaps.push(rHead.heapDeltaKb)
          baseTimes.push(rBase.timeMs)
          baseHeaps.push(rBase.heapDeltaKb)
        }
      }
      console.log(' Done.')

      if (
        baseTimes.length !== config.runs ||
        headTimes.length !== config.runs
      ) {
        throw new Error(
          `Runtime benchmark ${scenario.id} did not collect the requested samples`,
        )
      }
      if (
        !hasInformativeTimingSamples(baseTimes) ||
        !hasInformativeTimingSamples(headTimes)
      ) {
        throw new Error(
          `Runtime benchmark ${scenario.id} returned invalid timing samples`,
        )
      }
      if (
        baseHeaps.length !== config.runs ||
        headHeaps.length !== config.runs ||
        [...baseHeaps, ...headHeaps].some(
          (value) => !Number.isFinite(value) || value < 0,
        )
      ) {
        throw new Error(
          `Runtime benchmark ${scenario.id} returned invalid heap samples`,
        )
      }

      const isByteIdentical = scenario.bundles.every(
        (bundle) => bundleIdentities.get(`${scenario.id}:${bundle}`) === true,
      )

      const timeResult = summarizeTimeBenchmark({
        baseTimes,
        headTimes,
        isAATest,
        isByteIdentical,
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
        baseHeapMedianKb > 0
          ? ((headHeapMedianKb - baseHeapMedianKb) / baseHeapMedianKb) * 100
          : 0

      const heapResult = evaluateHeapVerdict({
        isByteIdentical,
        deltaHeapPercent,
        deltaHeapKb,
        noiseThresholdPercent: config.noiseThresholdPercent,
      })

      const cleanTimeVerdict = timeResult.timeVerdict.replace(
        ' (Identical code)',
        '',
      )
      const cleanHeapVerdict = heapResult.verdict.replace(
        ' (Identical code)',
        '',
      )

      results.push({
        id: scenario.id,
        name: scenario.name,
        isByteIdentical,
        baseTimes: timeResult.baseTimes,
        headTimes: timeResult.headTimes,
        baseHeaps,
        headHeaps,
        baseMedianMs: timeResult.baseMedianMs,
        headMedianMs: timeResult.headMedianMs,
        baseIqrMs: timeResult.baseIqrMs,
        headIqrMs: timeResult.headIqrMs,
        deltaMs: timeResult.deltaMs,
        deltaPercent: timeResult.deltaPercent,
        ciLowPercent: timeResult.ciLowPercent,
        ciHighPercent: timeResult.ciHighPercent,
        pValue: timeResult.pValue,
        bootstrapIterations: timeResult.bootstrapIterations,
        bootstrapSeed: timeResult.bootstrapSeed,
        baseHeapMedianKb,
        headHeapMedianKb,
        deltaHeapKb,
        deltaHeapPercent,
        timeStatus: timeResult.timeStatus,
        timeVerdict: cleanTimeVerdict,
        heapStatus: heapResult.status,
        heapVerdict: cleanHeapVerdict,
      })
    }
  } finally {
    try {
      await browser?.close()
    } finally {
      try {
        server?.stop()
      } finally {
        if (createdWorktreePath) {
          cleanupWorktree(createdWorktreePath)
        }
      }
    }
  }

  let deltaSizeStr = '0 B (0.0%)'
  const deltaBytes = baseRuntimeBytes - headRuntimeBytes
  const deltaPercent =
    baseRuntimeBytes > 0 ? (deltaBytes / baseRuntimeBytes) * 100 : 0
  if (deltaBytes !== 0) {
    const sign = deltaBytes > 0 ? '+' : '-'
    const absBytes = Math.abs(deltaBytes)
    const absPercent = Math.abs(deltaPercent)
    const sizeStr =
      absBytes >= 1024 ? formatKb(absBytes / 1024) : `${absBytes} B`
    const pctStr =
      absPercent < 0.1 && absPercent > 0
        ? absPercent.toFixed(2)
        : absPercent.toFixed(1)
    deltaSizeStr = `${sign}${sizeStr} (${sign}${pctStr}%)`
  }
  console.log(
    `\nRuntime size: Base ${formatKb(baseRuntimeBytes / 1024)} vs. Head ${formatKb(headRuntimeBytes / 1024)} (Delta: ${deltaSizeStr})`,
  )

  // Print CLI Summary Table
  console.log(
    '\n==================================== BENCHMARK RESULTS ====================================',
  )
  console.log(
    'Case'.padEnd(17) +
      'Base/Head time'.padStart(20) +
      'Delta'.padStart(9) +
      '  Time Verdict'.padEnd(18) +
      'Base/Head heap'.padStart(21) +
      'Delta'.padStart(11) +
      '  Heap Verdict',
  )
  console.log('-'.repeat(110))

  for (const r of results) {
    const baseStr = formatMs(r.baseMedianMs)
    const headStr = formatMs(r.headMedianMs)
    const timeCombined = `${baseStr} / ${headStr}`
    const deltaPctStr = formatPercent(r.deltaPercent)
    const baseHeapStr = formatKb(r.baseHeapMedianKb)
    const headHeapStr = formatKb(r.headHeapMedianKb)
    const heapCombined = `${baseHeapStr} / ${headHeapStr}`
    const deltaHeapStr = `${r.deltaHeapKb >= 0 ? '+' : ''}${formatKb(r.deltaHeapKb)}`

    console.log(
      r.id.padEnd(17) +
        timeCombined.padStart(20) +
        deltaPctStr.padStart(9) +
        '  ' +
        r.timeVerdict.padEnd(16) +
        heapCombined.padStart(21) +
        deltaHeapStr.padStart(11) +
        '  ' +
        r.heapVerdict,
    )
  }
  console.log(
    '===========================================================================================\n',
  )

  // Format Markdown
  const hasRegressions = results.some(
    (r) => r.timeStatus === 'regression' || r.heapStatus === 'regression',
  )
  const markdownLines = [
    '## ⚡ Nordcraft Runtime Performance Benchmark',
    '',
    `- **Noise & Equivalence Threshold**: ±${config.noiseThresholdPercent.toFixed(1)}% (Delta within CI or threshold reported as 1:1)`,
    `- **Bootstrap**: ${config.bootstrapIterations} iterations, seed ${config.bootstrapSeed}`,
    `- **Base ref**: ${config.baseRef ?? 'head-only A/A'}`,
    `- **Page Bundle Identity**: ${isPageBundleIdentical ? '`Identical build artifacts (1:1 confirmed)`' : '`Distinct build artifacts`'}`,
    `- **Runtime Size**: Base ${formatKb(baseRuntimeBytes / 1024)} vs. Head ${formatKb(headRuntimeBytes / 1024)} (Delta: ${deltaSizeStr})`,
    '',
  ]

  if (hasRegressions) {
    markdownLines.push(
      '> ⚠️ **Warning**: Performance regression detected above threshold in one or more scenarios. Check table below for details.',
      '',
    )
  } else {
    markdownLines.push(
      '> ✅ **No regressions detected**. Runtime performance is 1:1 or improved.',
      '',
    )
  }

  markdownLines.push(
    '| Scenario | Base/Head time | Delta | Time Verdict | Base/Head heap | Delta | Heap Verdict |',
    '| :--- | ---: | ---: | :---: | ---: | ---: | :---: |',
    ...results.map((r) => {
      const baseStr = formatMs(r.baseMedianMs)
      const headStr = formatMs(r.headMedianMs)
      const timeCombined = `${baseStr} / ${headStr}`
      const deltaPctStr = formatPercent(r.deltaPercent)
      const deltaMsStr = `${r.deltaMs >= 0 ? '+' : ''}${formatMs(r.deltaMs)}`
      const timeDeltaFull = `${deltaPctStr} (${deltaMsStr})`
      const baseHeapStr = formatKb(r.baseHeapMedianKb)
      const headHeapStr = formatKb(r.headHeapMedianKb)
      const heapCombined = `${baseHeapStr} / ${headHeapStr}`
      const deltaHeapStr = `${r.deltaHeapKb >= 0 ? '+' : ''}${formatKb(r.deltaHeapKb)} (${r.deltaHeapPercent >= 0 ? '+' : ''}${r.deltaHeapPercent.toFixed(1)}%)`
      return `| **${r.id}** | ${timeCombined} | ${timeDeltaFull} | ${r.timeVerdict} | ${heapCombined} | ${deltaHeapStr} | ${r.heapVerdict} |`
    }),
    '',
  )

  const markdownContent = markdownLines.join('\n')

  if (config.exportMarkdown) {
    fs.writeFileSync(config.exportMarkdown, markdownContent, 'utf-8')
    console.log(`Markdown report written to: ${config.exportMarkdown}`)
  }

  if (config.exportJson) {
    fs.writeFileSync(
      config.exportJson,
      JSON.stringify(
        {
          config: {
            baseRef: config.baseRef ?? null,
            runs: config.runs,
            warmup: config.warmup,
            noiseThresholdPercent: config.noiseThresholdPercent,
            maxRegressionPercent: config.maxRegressionPercent,
            maxRegressionMs: config.maxRegressionMs,
            bootstrapIterations: config.bootstrapIterations,
            bootstrapSeed: config.bootstrapSeed,
            failOnRegression: config.failOnRegression,
          },
          isByteIdentical: isPageBundleIdentical,
          isAATest,
          results,
        },
        null,
        2,
      ),
      'utf-8',
    )
    console.log(`JSON report written to: ${config.exportJson}`)
  }

  if (hasRegressions && config.failOnRegression) {
    throw new Error('Performance regression detected above threshold')
  }
}

if (import.meta.main) {
  runBenchmark().catch((err) => {
    console.error('Benchmark execution failed:', err)
    process.exit(1)
  })
}
