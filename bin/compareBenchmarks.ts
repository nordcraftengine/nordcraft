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

const args = new Map(
  Bun.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value]
  }),
)

const basePath = args.get('--base')
const headPath = args.get('--head')
const maxRegressionPercent = Number(args.get('--max-regression-percent') ?? 5)
const maxRegressionMs = Number(args.get('--max-regression-ms') ?? 1.0)
const failOnRegression = (args.get('--fail-on-regression') ?? 'true') === 'true'

if (!basePath || !headPath) {
  throw new Error('Usage: bun bin/compareBenchmarks.ts --base=<path> --head=<path> [--max-regression-percent=5] [--max-regression-ms=1.0] [--fail-on-regression=true]')
}

const readJson = async <T>(path: string): Promise<T> => {
  const content = await Bun.file(path).text()
  return JSON.parse(content) as T
}

const base = await readJson<BenchmarkOutput>(basePath)
const head = await readJson<BenchmarkOutput>(headPath)

const percent = (current: number, previous: number) =>
  ((current - previous) / previous) * 100

const formatMs = (value: number) => `${value.toFixed(4)} ms`
const formatPct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const rows = head.results
  .map((headResult) => {
    const baseResult = base.results.find((candidate) => candidate.name === headResult.name)
    if (!baseResult) {
      return {
        name: headResult.name,
        baseMedian: NaN,
        headMedian: headResult.median,
        deltaMs: NaN,
        deltaPercent: NaN,
        status: 'missing-base',
      }
    }

    const deltaMs = headResult.median - baseResult.median
    const deltaPercent = percent(headResult.median, baseResult.median)
    const status =
      deltaPercent > maxRegressionPercent && deltaMs > maxRegressionMs
        ? 'regression'
        : deltaPercent < 0
          ? 'improvement'
          : 'ok'

    return {
      name: headResult.name,
      baseMedian: baseResult.median,
      headMedian: headResult.median,
      deltaMs,
      deltaPercent,
      status,
    }
  })
  .sort((a, b) => {
    const priority = (status: string) => {
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

    return priority(a.status) - priority(b.status)
  })

const regressions = rows.filter((row) => row.status === 'regression')

const markdownLines = [
  '## SSR Benchmark Comparison',
  '',
  `- Base runtime: ${base.runtime}`,
  `- Head runtime: ${head.runtime}`,
  `- Allowed regression threshold: ${maxRegressionPercent.toFixed(2)}% and ${maxRegressionMs.toFixed(4)} ms (median ms/op)`,
  '',
  '| Case | Base median | Head median | Delta (%) | Delta (ms) | Status |',
  '| --- | ---: | ---: | ---: | ---: | --- |',
  ...rows.map((row) => {
    const baseMedian = Number.isFinite(row.baseMedian) ? formatMs(row.baseMedian) : 'n/a'
    const deltaPercent = Number.isFinite(row.deltaPercent)
      ? formatPct(row.deltaPercent)
      : 'n/a'
    const deltaMs = Number.isFinite(row.deltaMs)
      ? formatMs(row.deltaMs)
      : 'n/a'
    const status =
      row.status === 'regression'
        ? ':x: regression'
        : row.status === 'improvement'
          ? ':rocket: faster'
          : row.status === 'ok'
            ? ':white_check_mark: ok'
            : ':warning: missing base'

    return `| ${row.name} | ${baseMedian} | ${formatMs(row.headMedian)} | ${deltaPercent} | ${deltaMs} | ${status} |`
  }),
]

console.log(markdownLines.join('\n'))

if (regressions.length > 0 && failOnRegression) {
  const message = regressions
    .map((row) => `${row.name}: ${formatPct(row.deltaPercent)}, ${formatMs(row.deltaMs)}`)
    .join(', ')
  throw new Error(`SSR benchmark regression above threshold: ${message}`)
}
