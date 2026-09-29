/* eslint-disable no-console */
import { join } from 'node:path'

import {
  getBoolean,
  getNonNegativeNumber,
  getNumber,
  getOptionalString,
  getPositiveInteger,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  SSR_BENCHMARK_CASES,
  type SsrBenchmarkCaseId,
} from '../benchmarks/ssrCases'
import {
  hasInformativeTimingSamples,
  summarizeTimeBenchmark,
  type TimeBenchmarkResult,
} from '../benchmarks/stats'

export type SampleReadResult = number[] | undefined

export type BenchmarkRow = {
  caseId: SsrBenchmarkCaseId
  caseName: string
  baseMedianMs: number
  headMedianMs: number
  deltaPercent: number
  deltaMs: number
  ciLowPercent: number
  ciHighPercent: number
  pValue: number
  status:
    | 'regression'
    | 'improvement'
    | 'ok'
    | 'missing-base'
    | 'missing-head'
    | 'insufficient-base'
    | 'insufficient-head'
    | 'inconclusive'
  summary?: TimeBenchmarkResult
}

export type CompareConfig = {
  baseDir: string
  headDir: string
  maxRegressionPercent: number
  maxRegressionMs: number
  noiseThresholdPercent: number
  bootstrapIterations: number
  bootstrapSeed: number
  failOnRegression: boolean
  repeat: number
  outputPath?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFiniteNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.every(
    (item): item is number =>
      typeof item === 'number' && Number.isFinite(item) && item > 0,
  )

export const readSamples = async (
  filePath: string,
  repeat: number,
): Promise<SampleReadResult> => {
  if (!Number.isInteger(repeat) || repeat < 1) {
    return undefined
  }

  const file = Bun.file(filePath)
  if (!(await file.exists())) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text()) as unknown
  } catch {
    return undefined
  }

  if (!isRecord(parsed)) {
    return undefined
  }

  if (isFiniteNumberArray(parsed.timesMs)) {
    return parsed.timesMs
  }

  const times = isFiniteNumberArray(parsed.times)
    ? parsed.times
    : isRecord(parsed.results) &&
        Array.isArray(parsed.results) &&
        isRecord(parsed.results[0]) &&
        isFiniteNumberArray(parsed.results[0].times)
      ? parsed.results[0].times
      : undefined

  if (!times) {
    return undefined
  }

  return times.map((seconds) => (seconds * 1000) / repeat)
}

const getStatus = (summary: TimeBenchmarkResult): BenchmarkRow['status'] => {
  if (summary.timeStatus === 'regression') return 'regression'
  if (summary.timeStatus === 'improvement') return 'improvement'
  if (summary.timeStatus === 'inconclusive') return 'inconclusive'
  return 'ok'
}

const compareCase = async ({
  caseId,
  name,
  config,
}: {
  caseId: SsrBenchmarkCaseId
  name: string
  config: CompareConfig
}): Promise<BenchmarkRow> => {
  const baseTimes = await readSamples(
    join(config.baseDir, `${caseId}.json`),
    config.repeat,
  )
  const headTimes = await readSamples(
    join(config.headDir, `${caseId}.json`),
    config.repeat,
  )

  const missing = (
    status:
      | 'missing-base'
      | 'missing-head'
      | 'insufficient-base'
      | 'insufficient-head',
  ): BenchmarkRow => ({
    caseId,
    caseName: name,
    baseMedianMs: Number.NaN,
    headMedianMs: Number.NaN,
    deltaPercent: Number.NaN,
    deltaMs: Number.NaN,
    ciLowPercent: Number.NaN,
    ciHighPercent: Number.NaN,
    pValue: Number.NaN,
    status,
  })

  if (baseTimes === undefined) return missing('missing-base')
  if (headTimes === undefined) return missing('missing-head')
  if (baseTimes.length < 2) {
    return missing('insufficient-base')
  }
  if (headTimes.length < 2) {
    return missing('insufficient-head')
  }
  if (!hasInformativeTimingSamples(baseTimes)) {
    return missing('inconclusive')
  }
  if (!hasInformativeTimingSamples(headTimes)) {
    return missing('inconclusive')
  }

  const summary = summarizeTimeBenchmark({
    baseTimes,
    headTimes,
    noiseThresholdPercent: config.noiseThresholdPercent,
    maxRegressionPercent: config.maxRegressionPercent,
    maxRegressionMs: config.maxRegressionMs,
    bootstrapIterations: config.bootstrapIterations,
    bootstrapSeed: config.bootstrapSeed,
  })

  return {
    caseId,
    caseName: name,
    baseMedianMs: summary.baseMedianMs,
    headMedianMs: summary.headMedianMs,
    deltaPercent: summary.deltaPercent,
    deltaMs: summary.deltaMs,
    ciLowPercent: summary.ciLowPercent,
    ciHighPercent: summary.ciHighPercent,
    pValue: summary.pValue,
    status: getStatus(summary),
    summary,
  }
}

const formatMs = (value: number) => `${value.toFixed(4)} ms`
const formatPct = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const formatValue = (value: number, formatter: (number: number) => string) =>
  Number.isFinite(value) ? formatter(value) : 'n/a'

export const renderMarkdown = (rows: BenchmarkRow[], config: CompareConfig) => {
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

  const sortedRows = [...rows].sort(
    (a, b) => priority(a.status) - priority(b.status),
  )
  return [
    '## SSR Benchmark Comparison',
    '',
    '- Measurement source: shared benchmark statistics (95% bootstrap CI and Welch p-value)',
    `- Legacy hyperfine inputs are converted from seconds to milliseconds and divided by repeat=${config.repeat}`,
    `- Noise threshold: ${config.noiseThresholdPercent.toFixed(2)}%`,
    `- Allowed regression threshold: ${config.maxRegressionPercent.toFixed(2)}% and ${config.maxRegressionMs.toFixed(4)} ms`,
    `- Bootstrap: ${config.bootstrapIterations} iterations, seed ${config.bootstrapSeed}`,
    '',
    '| Case | Base median | Head median | Delta (%) | Delta (ms) | 95% CI | p-value | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
    ...sortedRows.map((row) => {
      const status =
        row.status === 'regression'
          ? ':x: regression'
          : row.status === 'improvement'
            ? ':rocket: faster'
            : row.status === 'ok'
              ? ':white_check_mark: ok'
              : `:warning: ${row.status.replace('-', ' ')}`
      const ci = Number.isFinite(row.ciLowPercent)
        ? `${formatPct(row.ciLowPercent)} / ${formatPct(row.ciHighPercent)}`
        : 'n/a'
      const pValue = Number.isFinite(row.pValue)
        ? row.pValue.toExponential(2)
        : 'n/a'
      return `| ${row.caseName} | ${formatValue(row.baseMedianMs, formatMs)} | ${formatValue(row.headMedianMs, formatMs)} | ${formatValue(row.deltaPercent, formatPct)} | ${formatValue(row.deltaMs, formatMs)} | ${ci} | ${pValue} | ${status} |`
    }),
  ].join('\n')
}

export const parseCompareConfig = (
  argv: readonly string[] = Bun.argv.slice(2),
): CompareConfig => {
  const args = parseBenchmarkArgs(argv)
  const baseDir = args.get('--base-dir') ?? args.get('--base')
  const headDir = args.get('--head-dir') ?? args.get('--head')
  if (!baseDir || !headDir) {
    throw new Error(
      'Usage: bun bin/compareBenchmarks.ts --base-dir=<path> --head-dir=<path> [--repeat=1] [--max-regression-percent=5] [--max-regression-ms=1.0] [--noise-threshold-percent=1.5] [--bootstrap-iterations=1000] [--bootstrap-seed=0] [--fail-on-regression=true]',
    )
  }

  const config: CompareConfig = {
    baseDir,
    headDir,
    maxRegressionPercent: getNonNegativeNumber(
      args,
      '--max-regression-percent',
      5,
    ),
    maxRegressionMs: getNonNegativeNumber(args, '--max-regression-ms', 1.0),
    noiseThresholdPercent: getNonNegativeNumber(
      args,
      '--noise-threshold-percent',
      1.5,
    ),
    bootstrapIterations: getPositiveInteger(
      args,
      '--bootstrap-iterations',
      1000,
    ),
    bootstrapSeed: getNumber(args, '--bootstrap-seed', 0),
    failOnRegression: getBoolean(args, '--fail-on-regression', true),
    repeat: getPositiveInteger(args, '--repeat', 1),
    outputPath: getOptionalString(args, '--output'),
  }
  if (!Number.isInteger(config.bootstrapSeed)) {
    throw new Error('--bootstrap-seed must be an integer')
  }
  return config
}

export const compareBenchmarkDirectories = async (config: CompareConfig) => {
  const rows = await Promise.all(
    SSR_BENCHMARK_CASES.map(({ id, name }) =>
      compareCase({ caseId: id, name, config }),
    ),
  )
  const markdown = renderMarkdown(rows, config)
  if (config.outputPath) {
    await Bun.write(config.outputPath, `${markdown}\n`)
  } else {
    console.log(markdown)
  }
  return { rows, markdown }
}

export const main = async (argv: readonly string[] = Bun.argv.slice(2)) => {
  const config = parseCompareConfig(argv)
  const { rows } = await compareBenchmarkDirectories(config)
  const unavailable = rows.filter(
    (row) =>
      row.status === 'missing-base' ||
      row.status === 'missing-head' ||
      row.status === 'insufficient-base' ||
      row.status === 'insufficient-head' ||
      row.status === 'inconclusive',
  )
  if (unavailable.length > 0) {
    throw new Error(
      `SSR benchmark comparison unavailable: ${unavailable
        .map((row) => `${row.caseName}: ${row.status}`)
        .join(', ')}`,
    )
  }

  const regressions = rows.filter((row) => row.status === 'regression')
  if (regressions.length > 0 && config.failOnRegression) {
    throw new Error(
      `SSR benchmark regression above threshold: ${regressions
        .map(
          (row) =>
            `${row.caseName}: ${formatPct(row.deltaPercent)}, ${formatMs(row.deltaMs)}`,
        )
        .join(', ')}`,
    )
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Benchmark comparison failed:', error)
    process.exit(1)
  })
}
