type HyperfineResult = {
  command: string
  mean: number
  stddev: number
  median: number
  min: number
  max: number
  times: number[]
}

type HyperfineOutput = {
  results: HyperfineResult[]
}

type BenchmarkRow = {
  caseId: string
  caseName: string
  baseMedianMs: number
  headMedianMs: number
  deltaPercent: number
  deltaMs: number
  status: 'regression' | 'improvement' | 'ok' | 'missing-base' | 'missing-head'
}

const args = new Map(
  Bun.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value]
  }),
)

const baseDir = args.get('--base-dir')
const headDir = args.get('--head-dir')
const maxRegressionPercent = Number(args.get('--max-regression-percent') ?? 5)
const maxRegressionMs = Number(args.get('--max-regression-ms') ?? 1.0)
const failOnRegression = (args.get('--fail-on-regression') ?? 'true') === 'true'

if (!baseDir || !headDir) {
  throw new Error(
    'Usage: bun bin/compareBenchmarks.ts --base-dir=<path> --head-dir=<path> [--max-regression-percent=5] [--max-regression-ms=1.0] [--fail-on-regression=true]',
  )
}

const BENCHMARK_CASES = [
  {
    id: 'formula',
    name: 'core.applyFormula (complex mix, 3k evals)',
  },
  {
    id: 'collections-hot-path',
    name: 'ssr.renderPageBody (collections hot path)',
  },
  {
    id: 'example-project-homepage',
    name: 'ssr.renderPageBody (example project HomePage)',
  },
] as const

const percent = (current: number, previous: number) =>
  ((current - previous) / previous) * 100

const formatMs = (value: number) => `${value.toFixed(4)} ms`
const formatPct = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const readHyperfineMedianMs = async (
  path: string,
): Promise<number | undefined> => {
  try {
    const content = await Bun.file(path).text()
    const parsed = JSON.parse(content) as HyperfineOutput
    const result = parsed.results[0]
    if (!result) {
      return undefined
    }

    return result.median * 1000
  } catch {
    return undefined
  }
}

const rows = await Promise.all(
  BENCHMARK_CASES.map(async ({ id, name }): Promise<BenchmarkRow> => {
    const baseMedianMs = await readHyperfineMedianMs(`${baseDir}/${id}.json`)
    const headMedianMs = await readHyperfineMedianMs(`${headDir}/${id}.json`)

    if (baseMedianMs === undefined) {
      return {
        caseId: id,
        caseName: name,
        baseMedianMs: NaN,
        headMedianMs: headMedianMs ?? NaN,
        deltaPercent: NaN,
        deltaMs: NaN,
        status: 'missing-base',
      }
    }

    if (headMedianMs === undefined) {
      return {
        caseId: id,
        caseName: name,
        baseMedianMs,
        headMedianMs: NaN,
        deltaPercent: NaN,
        deltaMs: NaN,
        status: 'missing-head',
      }
    }

    const deltaMs = headMedianMs - baseMedianMs
    const deltaPercent = percent(headMedianMs, baseMedianMs)

    const status =
      deltaPercent > maxRegressionPercent && deltaMs > maxRegressionMs
        ? 'regression'
        : deltaPercent < 0
          ? 'improvement'
          : 'ok'

    return {
      caseId: id,
      caseName: name,
      baseMedianMs,
      headMedianMs,
      deltaPercent,
      deltaMs,
      status,
    }
  }),
)

const priority = (status: BenchmarkRow['status']) => {
  switch (status) {
    case 'regression':
      return 0
    case 'ok':
      return 1
    case 'improvement':
      return 2
    default:
      return 3
  }
}

rows.sort((a, b) => priority(a.status) - priority(b.status))

const regressions = rows.filter((row) => row.status === 'regression')

const markdownLines = [
  '## SSR Benchmark Comparison',
  '',
  '- Measurement source: hyperfine median',
  `- Allowed regression threshold: ${maxRegressionPercent.toFixed(2)}% and ${maxRegressionMs.toFixed(4)} ms`,
  '',
  '| Case | Base median | Head median | Delta (%) | Delta (ms) | Status |',
  '| --- | ---: | ---: | ---: | ---: | --- |',
  ...rows.map((row) => {
    const baseMedian = Number.isFinite(row.baseMedianMs)
      ? formatMs(row.baseMedianMs)
      : 'n/a'
    const headMedian = Number.isFinite(row.headMedianMs)
      ? formatMs(row.headMedianMs)
      : 'n/a'
    const deltaPercent = Number.isFinite(row.deltaPercent)
      ? formatPct(row.deltaPercent)
      : 'n/a'
    const deltaMs = Number.isFinite(row.deltaMs) ? formatMs(row.deltaMs) : 'n/a'

    const status =
      row.status === 'regression'
        ? ':x: regression'
        : row.status === 'improvement'
          ? ':rocket: faster'
          : row.status === 'ok'
            ? ':white_check_mark: ok'
            : row.status === 'missing-base'
              ? ':warning: missing base'
              : ':warning: missing head'

    return `| ${row.caseName} | ${baseMedian} | ${headMedian} | ${deltaPercent} | ${deltaMs} | ${status} |`
  }),
]

console.log(markdownLines.join('\n'))

if (regressions.length > 0 && failOnRegression) {
  const message = regressions
    .map((row) => `${row.caseName}: ${formatPct(row.deltaPercent)}, ${formatMs(row.deltaMs)}`)
    .join(', ')
  throw new Error(`SSR benchmark regression above threshold: ${message}`)
}
