import { describe, expect, test } from 'bun:test'
import {
  bootstrapCi,
  evaluateHeapVerdict,
  evaluateVerdict,
  formatKb,
  formatMs,
  formatPercent,
  hasInformativeTimingSamples,
  mean,
  median,
  normalCdf,
  percentageDelta,
  quantile,
  studentTCdf,
  summarizeTimeBenchmark,
  variance,
  welchTTest,
} from './stats'

describe('Benchmark Stats', () => {
  test('median and quantile calculation', () => {
    const data = [10, 20, 30, 40, 50]
    expect(median(data)).toBe(30)
    expect(quantile(data, 0)).toBe(10)
    expect(quantile(data, 1)).toBe(50)
  })

  test('mean and variance calculation', () => {
    const data = [10, 20, 30, 40, 50]
    expect(mean(data)).toBe(30)
    expect(variance(data, mean(data))).toBe(250)
  })

  test('normalCdf standard values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4)
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2)
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 2)
  })

  test('studentTCdf uses the Student-t distribution', () => {
    expect(studentTCdf(0, 8)).toBe(0.5)
    expect(studentTCdf(1, 8)).toBeCloseTo(0.826703, 5)
    expect(studentTCdf(-1, 8)).toBeCloseTo(0.173297, 5)
    expect(studentTCdf(2, 30)).toBeCloseTo(0.972687, 5)
  })

  test('welchTTest detects identical distributions', () => {
    const a = [10, 11, 10, 12, 10, 11]
    const b = [10, 11, 10, 12, 10, 11]
    const p = welchTTest(a, b)
    expect(p).toBeCloseTo(1.0, 4)
  })

  test('welchTTest uses Welch degrees of freedom and flags constant samples', () => {
    const pValue = welchTTest([1, 2, 3, 4, 5], [4, 5, 6, 7, 8])
    expect(pValue).toBeCloseTo(0.0170717, 6)
    expect(welchTTest([1, 1, 1], [2, 2, 2])).toBe(1)
    expect(hasInformativeTimingSamples([1, 1, 1])).toBe(false)
  })

  test('bootstrapCi computes confidence interval', () => {
    const a = [20, 20.5, 19.5, 20.2, 19.8]
    const b = [20.1, 19.9, 20.0, 20.2, 19.9]
    const ci = bootstrapCi(a, b, 200)
    expect(ci.low).toBeLessThanOrEqual(ci.high)
    // Interval should span near zero for identical distributions
    expect(ci.low).toBeLessThanOrEqual(2)
    expect(ci.high).toBeGreaterThanOrEqual(-2)
  })

  test('bootstrapCi supports deterministic sampling and empty inputs', () => {
    expect(
      bootstrapCi([10, 20], [20, 30], {
        iterations: 10,
        random: () => 0,
      }),
    ).toEqual({ low: 100, high: 100 })
    expect(bootstrapCi([], [], 10)).toEqual({ low: 0, high: 0 })
  })

  test('percentageDelta reports an undefined zero-baseline percentage', () => {
    expect(Number.isNaN(percentageDelta(0, 10))).toBe(true)
    expect(percentageDelta(10, 12)).toBeCloseTo(20)
  })

  test('summarizeTimeBenchmark applies shared verdict logic without mutating samples', () => {
    const baseTimes = [99, 100, 100, 101, 100, 99, 101, 100]
    const headTimes = baseTimes.map((time) => time + 20)
    const originalBase = [...baseTimes]
    const originalHead = [...headTimes]

    const result = summarizeTimeBenchmark({
      baseTimes,
      headTimes,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
    })

    expect(result.timeStatus).toBe('regression')
    expect(result.deltaPercent).toBeCloseTo(20)
    expect(result.ciLowPercent).toBeGreaterThan(0)
    expect(result.pValue).toBeLessThan(0.01)
    expect(baseTimes).toEqual(originalBase)
    expect(headTimes).toEqual(originalHead)
  })

  test('summarizeTimeBenchmark handles identical artifacts and empty samples', () => {
    const identical = summarizeTimeBenchmark({
      baseTimes: [10, 11, 10],
      headTimes: [10, 11, 10],
      isByteIdentical: true,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
    })
    expect(identical.timeStatus).toBe('1:1')
    expect(identical.timeVerdict).toContain('Identical code')

    const aa = summarizeTimeBenchmark({
      baseTimes: [10, 11, 10],
      headTimes: [10, 11, 10],
      isAATest: true,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
    })
    expect(aa.timeStatus).toBe('1:1')
    expect(aa.timeVerdict).toContain('A/A mode')

    const empty = summarizeTimeBenchmark({
      baseTimes: [],
      headTimes: [],
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
    })
    expect(empty.baseMedianMs).toBe(0)
    expect(empty.timeStatus).toBe('inconclusive')
    expect(Number.isNaN(empty.deltaPercent)).toBe(true)
    expect(Number.isNaN(empty.deltaMs)).toBe(true)
    expect(Number.isFinite(empty.ciLowPercent)).toBe(true)
    expect(Number.isFinite(empty.pValue)).toBe(true)
  })

  test('summarizeTimeBenchmark marks degenerate samples inconclusive', () => {
    const result = summarizeTimeBenchmark({
      baseTimes: [10, 10, 10],
      headTimes: [20, 20, 20],
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
    })
    expect(result.timeStatus).toBe('inconclusive')
    expect(Number.isNaN(result.deltaPercent)).toBe(true)
  })

  test('summarizeTimeBenchmark records deterministic bootstrap settings', () => {
    const input = {
      baseTimes: [10, 11, 12, 13],
      headTimes: [11, 12, 13, 14],
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
      bootstrapIterations: 123,
      bootstrapSeed: 42,
    }
    const first = summarizeTimeBenchmark(input)
    const second = summarizeTimeBenchmark(input)
    expect(first.ciLowPercent).toBe(second.ciLowPercent)
    expect(first.ciHighPercent).toBe(second.ciHighPercent)
    expect(first.bootstrapIterations).toBe(123)
    expect(first.bootstrapSeed).toBe(42)
  })

  test('evaluateVerdict handles identical code', () => {
    const result = evaluateVerdict({
      isByteIdentical: true,
      deltaPercent: 0,
      deltaMs: 0,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3.0,
      maxRegressionMs: 1.0,
      pValue: 1.0,
      ci: { low: -0.5, high: 0.5 },
    })
    expect(result.status).toBe('1:1')
    expect(result.verdict).toContain('Identical code')
  })

  test('evaluateVerdict handles no significant difference within noise', () => {
    const result = evaluateVerdict({
      isByteIdentical: false,
      deltaPercent: 0.8,
      deltaMs: 0.2,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3.0,
      maxRegressionMs: 1.0,
      pValue: 0.45,
      ci: { low: -0.8, high: 1.2 },
    })
    expect(result.status).toBe('1:1')
  })

  test('evaluateVerdict detects real regression', () => {
    const result = evaluateVerdict({
      isByteIdentical: false,
      deltaPercent: 12.5,
      deltaMs: 3.5,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3.0,
      maxRegressionMs: 1.0,
      pValue: 0.0001,
      ci: { low: 10.0, high: 15.0 },
    })
    expect(result.status).toBe('regression')
    expect(result.verdict).toContain('Regression')
  })

  test('evaluateVerdict requires both regression thresholds', () => {
    const result = evaluateVerdict({
      isByteIdentical: false,
      deltaPercent: 5,
      deltaMs: 0.5,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
      pValue: 0.0001,
      ci: { low: 1, high: 2 },
    })
    expect(result.status).toBe('stable')
  })

  test('evaluateVerdict detects real improvement', () => {
    const result = evaluateVerdict({
      isByteIdentical: false,
      deltaPercent: -10.0,
      deltaMs: -2.5,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3.0,
      maxRegressionMs: 1.0,
      pValue: 0.0001,
      ci: { low: -12.0, high: -8.0 },
    })
    expect(result.status).toBe('improvement')
    expect(result.verdict).toContain('Faster')
  })

  test('evaluateHeapVerdict handles identical code and small noise', () => {
    const ident = evaluateHeapVerdict({
      isByteIdentical: true,
      deltaHeapPercent: 0,
      deltaHeapKb: 0,
    })
    expect(ident.status).toBe('1:1')

    const noise = evaluateHeapVerdict({
      isByteIdentical: false,
      deltaHeapPercent: 0.5,
      deltaHeapKb: 12,
    })
    expect(noise.status).toBe('1:1')
  })

  test('evaluateHeapVerdict detects memory reduction (improvement)', () => {
    const res = evaluateHeapVerdict({
      isByteIdentical: false,
      deltaHeapPercent: -6.4,
      deltaHeapKb: -451.8,
    })
    expect(res.status).toBe('improvement')
    expect(res.verdict).toContain('💾')
    expect(res.verdict).toContain('-6.4%')
  })

  test('evaluateHeapVerdict detects memory regression', () => {
    const res = evaluateHeapVerdict({
      isByteIdentical: false,
      deltaHeapPercent: 15.0,
      deltaHeapKb: 500,
    })
    expect(res.status).toBe('regression')
    expect(res.verdict).toContain('⚠️')
    expect(res.verdict).toContain('+15.0%')
  })

  test('formatKb formats KB and MB properly', () => {
    expect(formatKb(500)).toBe('500.0 KB')
    expect(formatKb(2048)).toBe('2.00 MB')
  })

  test('formatMs formats milliseconds properly and handles non-finite numbers', () => {
    expect(formatMs(12.3456)).toBe('12.35 ms')
    expect(formatMs(Number.NaN)).toBe('n/a')
    expect(formatMs(Number.POSITIVE_INFINITY)).toBe('n/a')
  })

  test('formatPercent formats percentages with sign and handles non-finite numbers', () => {
    expect(formatPercent(4.567)).toBe('+4.57%')
    expect(formatPercent(-3.21)).toBe('-3.21%')
    expect(formatPercent(0)).toBe('+0.00%')
    expect(formatPercent(Number.NaN)).toBe('n/a')
  })
})
