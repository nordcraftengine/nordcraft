import { describe, expect, test } from 'bun:test'

import {
  buildMarkdownReport,
  formatPreciseMs,
  type Config,
  type LibBenchmarkCaseResult,
} from '../bin/runLibBenchmark'

const config: Config = {
  baseRef: 'abc123',
  runs: 15,
  warmup: 3,
  repeat: 5,
  noiseThresholdPercent: 2.0,
  maxRegressionPercent: 5.0,
  maxRegressionMs: 0.5,
  responseTimeoutMs: 120_000,
  bootstrapIterations: 1000,
  bootstrapSeed: 0,
  failOnRegression: true,
  skipBuild: false,
  keepWorktree: false,
}

const makeResult = (
  timeStatus: LibBenchmarkCaseResult['timeStatus'],
): LibBenchmarkCaseResult => ({
  id: 'formula-sum',
  name: 'sum',
  mode: 'comparison',
  baseTimes: [1.1, 1.2],
  headTimes: [1.1, 1.2],
  baseMedianMs: 1.15,
  headMedianMs: 1.15,
  baseIqrMs: 0.05,
  headIqrMs: 0.05,
  deltaMs: 0,
  deltaPercent: 0,
  ciLowPercent: -1,
  ciHighPercent: 1,
  pValue: 0.5,
  bootstrapIterations: 1000,
  bootstrapSeed: 0,
  timeStatus,
  timeVerdict: '🟢 1:1',
})

describe('lib benchmark markdown report', () => {
  test('collapses to a one-liner when every case is 1:1 or stable', () => {
    const markdown = buildMarkdownReport({
      config,
      results: [makeResult('1:1'), makeResult('1:1'), makeResult('stable')],
    })

    expect(markdown).toContain('✅ No change')
    expect(markdown).toContain('1:1 with base (3 cases)')
    expect(markdown).not.toContain('| Case |')
  })

  test('renders the full table when a case regressed', () => {
    const markdown = buildMarkdownReport({
      config,
      results: [makeResult('1:1'), makeResult('regression')],
    })

    expect(markdown).toContain('| Case |')
    expect(markdown).toContain('formula-sum')
    expect(markdown).toContain(
      'Performance regression detected above threshold',
    )
  })

  test('renders the full table when a case improved or is inconclusive', () => {
    for (const timeStatus of ['improvement', 'inconclusive'] as const) {
      const markdown = buildMarkdownReport({
        config,
        results: [makeResult(timeStatus)],
      })
      expect(markdown).toContain('| Case |')
      expect(markdown).not.toContain('✅ No change')
    }
  })

  test('renders the full table when there are no results', () => {
    const markdown = buildMarkdownReport({ config, results: [] })

    expect(markdown).toContain('| Case |')
    expect(markdown).not.toContain('✅ No change')
  })

  test('renders sub-resolution timings in microseconds', () => {
    expect(formatPreciseMs(0.001234)).toBe('1.23 µs')
    expect(formatPreciseMs(-0.00012)).toBe('-0.12 µs')
    expect(formatPreciseMs(0)).toBe('0.00 ms')
    expect(formatPreciseMs(12.3456)).toBe('12.35 ms')
    expect(formatPreciseMs(Number.NaN)).toBe('n/a')

    const tiny = {
      ...makeResult('regression'),
      baseMedianMs: 0.0012,
      headMedianMs: 0.001,
    }
    const markdown = buildMarkdownReport({ config, results: [tiny] })

    expect(markdown).toContain('1.20 µs')
    expect(markdown).toContain('1.00 µs')
    expect(markdown).not.toContain('0.00 ms / 0.00 ms')
  })
})
