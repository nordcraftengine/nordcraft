import { describe, expect, test } from 'bun:test'
import { isWorkerResponse, parseConfig } from '../bin/runSsrBenchmarks'

describe('SSR benchmark runner configuration', () => {
  test('uses origin/main and statistically meaningful defaults', () => {
    const config = parseConfig([])

    expect(config.baseRef).toBe('origin/main')
    expect(config.runs).toBe(20)
    expect(config.warmup).toBe(4)
    expect(config.repeat).toBe(1)
    expect(config.maxRegressionPercent).toBe(3)
    expect(config.maxRegressionMs).toBe(1)
    expect(config.responseTimeoutMs).toBe(120_000)
    expect(config.bootstrapIterations).toBe(1000)
    expect(config.bootstrapSeed).toBe(0)
  })

  test('supports an explicit head-only run', () => {
    const config = parseConfig([
      '--base-ref=',
      '--skip-build=true',
      '--runs=3',
      '--warmup=0',
    ])

    expect(config.baseRef).toBeUndefined()
    expect(config.skipBuild).toBe(true)
    expect(config.runs).toBe(3)
    expect(config.warmup).toBe(0)
  })

  test('validates worker response shapes', () => {
    expect(isWorkerResponse({ timeMs: 12.5 })).toBe(true)
    expect(isWorkerResponse({ error: 'render failed' })).toBe(true)
    expect(isWorkerResponse({ timeMs: Number.NaN })).toBe(false)
    expect(isWorkerResponse({ timeMs: -1 })).toBe(false)
    expect(isWorkerResponse({ timeMs: 0 })).toBe(false)
    expect(isWorkerResponse({ timeMs: 1, error: 'ambiguous' })).toBe(false)
    expect(isWorkerResponse(null)).toBe(false)
  })

  test('rejects invalid thresholds and incompatible build options', () => {
    expect(() => parseConfig(['--max-regression-ms=-1'])).toThrow(
      'Benchmark thresholds must not be negative',
    )
    expect(() =>
      parseConfig(['--base-ref=HEAD~1', '--skip-build=true']),
    ).toThrow('--skip-build=true is not supported')
    expect(() => parseConfig(['--response-timeout-ms=0'])).toThrow(
      'response-timeout-ms must be greater than 0',
    )
    expect(() => parseConfig(['--bootstrap-seed=1.5'])).toThrow(
      'bootstrap-seed must be an integer',
    )
  })
})
