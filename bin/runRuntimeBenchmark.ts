/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import { startBenchmarkServer } from '../benchmarks/browser/server'
import {
  bootstrapCi,
  computeSha256,
  evaluateHeapVerdict,
  evaluateTimeVerdict,
  formatKb,
  median,
  quantile,
  welchTTest,
} from '../benchmarks/stats'

interface RunCaseResult {
  timeMs: number
  heapDeltaKb: number
}

interface BenchmarkCaseResult {
  id: string
  name: string
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
  baseHeapMedianKb: number
  headHeapMedianKb: number
  deltaHeapKb: number
  deltaHeapPercent: number
  timeStatus: '1:1' | 'improvement' | 'regression' | 'stable'
  timeVerdict: string
  heapStatus: '1:1' | 'improvement' | 'regression' | 'stable'
  heapVerdict: string
}

const CASES = [
  {
    id: 'mount-nordcraft',
    name: "mount-nordcraft (real nordcraft.com front page 'nordcraft': 213 components & 2.5k nodes)",
  },
  {
    id: 'mount-pricing',
    name: "mount-pricing (real nordcraft.com 'pricing' page: 169 nodes, tables & formulas)",
  },
  {
    id: 'reactive-clicks',
    name: 'reactive-clicks (2k click events, actions & signal updates)',
  },
  {
    id: 'list-repeat',
    name: 'list-repeat (15 cycles: 200 items populate & clear)',
  },
  {
    id: 'custom-element',
    name: 'custom-element (define & mount 200 custom elements)',
  },
] as const

function parseArgs() {
  const args = new Map<string, string>()
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.split('=')
    args.set(key, value ?? 'true')
  }

  return {
    baseRef: args.get('--base-ref') ?? 'origin/main',
    baseDir: args.get('--base-dir'),
    headDir: args.get('--head-dir') ?? path.resolve('packages/runtime/dist'),
    runs: Number(args.get('--runs') ?? 20),
    warmup: Number(args.get('--warmup') ?? 4),
    maxRegressionPercent: Number(args.get('--max-regression-percent') ?? 3.0),
    maxRegressionMs: Number(args.get('--max-regression-ms') ?? 1.0),
    noiseThresholdPercent: Number(args.get('--noise-threshold-percent') ?? 1.5),
    failOnRegression: args.get('--fail-on-regression') === 'true',
    exportJson: args.get('--export-json'),
    exportMarkdown: args.get('--export-markdown'),
  }
}

async function prepareBaseWorktree(baseRef: string): Promise<string> {
  const tmpDir = `/tmp/nordcraft-base-${Date.now()}`
  console.log(`Setting up base git worktree from ${baseRef} at ${tmpDir}...`)

  const addProc = Bun.spawnSync(['git', 'worktree', 'add', tmpDir, baseRef])
  if (addProc.exitCode !== 0) {
    throw new Error(
      `Failed to create worktree: ${addProc.stderr.toString().trim()}`,
    )
  }

  console.log(`Installing dependencies in base worktree...`)
  const installProc = Bun.spawnSync(['bun', 'install', '--frozen-lockfile'], {
    cwd: tmpDir,
  })
  if (installProc.exitCode !== 0) {
    console.warn(
      `Warning during base bun install: ${installProc.stderr.toString().trim()}`,
    )
  }

  console.log(`Building runtime packages in base worktree...`)
  const buildProc = Bun.spawnSync(['bun', 'run', 'build'], { cwd: tmpDir })
  if (buildProc.exitCode !== 0) {
    throw new Error(
      `Failed to build base packages: ${buildProc.stderr.toString().trim()}`,
    )
  }

  return path.join(tmpDir, 'packages/runtime/dist')
}

function cleanupWorktree(worktreeDir: string) {
  try {
    const parentDir = path.resolve(worktreeDir, '../../..')
    Bun.spawnSync(['git', 'worktree', 'remove', parentDir, '--force'])
  } catch {
    // Ignore cleanup error
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

  if (!baseDistDir) {
    try {
      createdWorktreePath = await prepareBaseWorktree(config.baseRef)
      baseDistDir = createdWorktreePath
    } catch (err) {
      console.warn(
        `Could not prepare base worktree from ${config.baseRef}:`,
        (err as Error).message,
      )
      console.log(
        'Falling back to comparing HEAD against HEAD (A/A test mode)...',
      )
      baseDistDir = config.headDir
    }
  }

  const baseSha = computeSha256(path.join(baseDistDir, 'page.main.esm.js'))
  const headSha = computeSha256(path.join(config.headDir, 'page.main.esm.js'))
  const isByteIdentical = Boolean(baseSha && headSha && baseSha === headSha)

  console.log(`Base bundle SHA: ${baseSha ? baseSha.slice(0, 10) : 'unknown'}`)
  console.log(`Head bundle SHA: ${headSha ? headSha.slice(0, 10) : 'unknown'}`)
  if (isByteIdentical) {
    console.log(
      '✨ Note: Runtime bundles are byte-for-byte identical (expected 1:1 result)',
    )
  }

  // Start local server
  const server = startBenchmarkServer({
    baseDistDir,
    headDistDir: config.headDir,
  })
  const serverUrl = `http://localhost:${server.port}`
  console.log(`Benchmark server running at ${serverUrl}`)

  // Launch Chromium
  console.log('Launching headless Chromium with GC & timer stabilization...')
  const browser = await chromium.launch({
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

  const baseContext = await browser.newContext()
  const headContext = await browser.newContext()

  const basePage = await baseContext.newPage()
  const headPage = await headContext.newPage()

  await Promise.all([
    basePage.goto(`${serverUrl}/harness.html?version=base`),
    headPage.goto(`${serverUrl}/harness.html?version=head`),
  ])

  await Promise.all([
    basePage.waitForFunction(() => (window as any).__harnessReady === true),
    headPage.waitForFunction(() => (window as any).__harnessReady === true),
  ])

  const results: BenchmarkCaseResult[] = []

  for (const scenario of CASES) {
    console.log(`\nBenchmarking: ${scenario.name}`)

    // Warmup
    console.log(`  Warming up (${config.warmup} iterations)...`)
    for (let w = 0; w < config.warmup; w++) {
      await basePage.bringToFront()
      await basePage.evaluate(
        async (id) => (window as any).__runCase(id),
        scenario.id,
      )
      await headPage.bringToFront()
      await headPage.evaluate(
        async (id) => (window as any).__runCase(id),
        scenario.id,
      )
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
        const rBase: RunCaseResult = await basePage.evaluate(
          async (id) => (window as any).__runCase(id),
          scenario.id,
        )
        await headPage.bringToFront()
        const rHead: RunCaseResult = await headPage.evaluate(
          async (id) => (window as any).__runCase(id),
          scenario.id,
        )
        baseTimes.push(rBase.timeMs)
        baseHeaps.push(rBase.heapDeltaKb)
        headTimes.push(rHead.timeMs)
        headHeaps.push(rHead.heapDeltaKb)
      } else {
        await headPage.bringToFront()
        const rHead: RunCaseResult = await headPage.evaluate(
          async (id) => (window as any).__runCase(id),
          scenario.id,
        )
        await basePage.bringToFront()
        const rBase: RunCaseResult = await basePage.evaluate(
          async (id) => (window as any).__runCase(id),
          scenario.id,
        )
        headTimes.push(rHead.timeMs)
        headHeaps.push(rHead.heapDeltaKb)
        baseTimes.push(rBase.timeMs)
        baseHeaps.push(rBase.heapDeltaKb)
      }
    }
    console.log(' Done.')

    const medBase = median(baseTimes)
    const medHead = median(headTimes)
    const iqrBase = quantile(baseTimes, 0.75) - quantile(baseTimes, 0.25)
    const iqrHead = quantile(headTimes, 0.75) - quantile(headTimes, 0.25)
    const deltaMs = medHead - medBase
    const deltaPercent = ((medHead - medBase) / medBase) * 100
    const ci = bootstrapCi(baseTimes, headTimes)
    const pValue = welchTTest(baseTimes, headTimes)

    const baseHeapMedianKb = median(baseHeaps)
    const headHeapMedianKb = median(headHeaps)
    const deltaHeapKb = headHeapMedianKb - baseHeapMedianKb
    const deltaHeapPercent =
      baseHeapMedianKb > 0
        ? ((headHeapMedianKb - baseHeapMedianKb) / baseHeapMedianKb) * 100
        : 0

    const timeResult = evaluateTimeVerdict({
      isByteIdentical,
      deltaPercent,
      deltaMs,
      noiseThresholdPercent: config.noiseThresholdPercent,
      maxRegressionPercent: config.maxRegressionPercent,
      maxRegressionMs: config.maxRegressionMs,
      pValue,
      ci,
    })

    const heapResult = evaluateHeapVerdict({
      isByteIdentical,
      deltaHeapPercent,
      deltaHeapKb,
      noiseThresholdPercent: config.noiseThresholdPercent,
    })

    results.push({
      id: scenario.id,
      name: scenario.name,
      baseTimes,
      headTimes,
      baseHeaps,
      headHeaps,
      baseMedianMs: medBase,
      headMedianMs: medHead,
      baseIqrMs: iqrBase,
      headIqrMs: iqrHead,
      deltaMs,
      deltaPercent,
      ciLowPercent: ci.low,
      ciHighPercent: ci.high,
      pValue,
      baseHeapMedianKb,
      headHeapMedianKb,
      deltaHeapKb,
      deltaHeapPercent,
      timeStatus: timeResult.status,
      timeVerdict: timeResult.verdict,
      heapStatus: heapResult.status,
      heapVerdict: heapResult.verdict,
    })
  }

  await browser.close()
  server.stop()

  if (createdWorktreePath) {
    cleanupWorktree(createdWorktreePath)
  }

  // Print CLI Summary Table
  console.log(
    '\n==================================== BENCHMARK RESULTS ====================================',
  )
  console.log(
    'Case'.padEnd(17) +
      'Base Time'.padStart(10) +
      'Head Time'.padStart(10) +
      'Time Delta'.padStart(11) +
      '  Time Verdict'.padEnd(16) +
      'Base Heap'.padStart(10) +
      'Head Heap'.padStart(10) +
      'Heap Delta'.padStart(11) +
      '  Heap Verdict',
  )
  console.log('-'.repeat(105))

  for (const r of results) {
    const baseStr = `${r.baseMedianMs.toFixed(1)} ms`
    const headStr = `${r.headMedianMs.toFixed(1)} ms`
    const deltaPctStr = `${r.deltaPercent >= 0 ? '+' : ''}${r.deltaPercent.toFixed(1)}%`
    const baseHeapStr = formatKb(r.baseHeapMedianKb)
    const headHeapStr = formatKb(r.headHeapMedianKb)
    const deltaHeapStr = `${r.deltaHeapKb >= 0 ? '+' : ''}${formatKb(r.deltaHeapKb)}`

    console.log(
      r.id.padEnd(17) +
        baseStr.padStart(10) +
        headStr.padStart(10) +
        deltaPctStr.padStart(11) +
        '  ' +
        r.timeVerdict.padEnd(16) +
        baseHeapStr.padStart(10) +
        headHeapStr.padStart(10) +
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
    `- **Methodology**: Headless Chromium • ${config.runs} Interleaved Trials • Forced Pre-run GC • ${config.warmup} Discarded Warmups`,
    `- **Noise & Equivalence Threshold**: ±${config.noiseThresholdPercent.toFixed(1)}% (Delta within CI or threshold reported as 1:1)`,
    `- **Bundle Identity**: ${isByteIdentical ? '`Identical build artifacts (1:1 confirmed)`' : '`Distinct build artifacts`'}`,
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
    '| Scenario | Base Time | Head Time | Time Delta | 95% CI | Time Verdict | Base Heap | Head Heap | Heap Delta | Heap Verdict |',
    '| :--- | ---: | ---: | ---: | :---: | :---: | ---: | ---: | ---: | :---: |',
    ...results.map((r) => {
      const baseStr = `${r.baseMedianMs.toFixed(2)} ms`
      const headStr = `${r.headMedianMs.toFixed(2)} ms`
      const deltaPctStr = `${r.deltaPercent >= 0 ? '+' : ''}${r.deltaPercent.toFixed(2)}%`
      const deltaMsStr = `${r.deltaMs >= 0 ? '+' : ''}${r.deltaMs.toFixed(2)} ms`
      const timeDeltaFull = `${deltaPctStr} (${deltaMsStr})`
      const ciStr = `[${r.ciLowPercent.toFixed(1)}%, ${r.ciHighPercent.toFixed(1)}%]`
      const baseHeapStr = formatKb(r.baseHeapMedianKb)
      const headHeapStr = formatKb(r.headHeapMedianKb)
      const deltaHeapStr = `${r.deltaHeapKb >= 0 ? '+' : ''}${formatKb(r.deltaHeapKb)} (${r.deltaHeapPercent >= 0 ? '+' : ''}${r.deltaHeapPercent.toFixed(1)}%)`
      return `| **${r.id}** | ${baseStr} | ${headStr} | ${timeDeltaFull} | ${ciStr} | ${r.timeVerdict} | ${baseHeapStr} | ${headHeapStr} | ${deltaHeapStr} | ${r.heapVerdict} |`
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
      JSON.stringify({ isByteIdentical, results }, null, 2),
      'utf-8',
    )
    console.log(`JSON report written to: ${config.exportJson}`)
  }

  if (hasRegressions && config.failOnRegression) {
    throw new Error('Performance regression detected above threshold')
  }
}

runBenchmark().catch((err) => {
  console.error('Benchmark execution failed:', err)
  process.exit(1)
})
