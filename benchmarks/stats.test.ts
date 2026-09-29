import { describe, expect, test } from 'bun:test'
import {
  bootstrapCi,
  evaluateHeapVerdict,
  evaluateVerdict,
  formatKb,
  mean,
  median,
  normalCdf,
  quantile,
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

  test('welchTTest detects identical distributions', () => {
    const a = [10, 11, 10, 12, 10, 11]
    const b = [10, 11, 10, 12, 10, 11]
    const p = welchTTest(a, b)
    expect(p).toBeCloseTo(1.0, 4)
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
})
