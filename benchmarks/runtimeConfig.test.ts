import { describe, expect, test } from 'bun:test'
import {
  parseRuntimeConfig,
  RUNTIME_BENCHMARK_CASES,
} from '../bin/runRuntimeBenchmark'

describe('runtime benchmark configuration', () => {
  test('uses origin/main and strict defaults for statistical comparisons', () => {
    const config = parseRuntimeConfig([])

    expect(config.baseRef).toBe('origin/main')
    expect(config.runs).toBe(20)
    expect(config.warmup).toBe(4)
    expect(config.bootstrapIterations).toBe(1000)
    expect(config.bootstrapSeed).toBe(0)
    expect(config.failOnRegression).toBe(true)
  })

  test('supports explicit head-only A/A and parsed report options', () => {
    const config = parseRuntimeConfig([
      '--base-ref=',
      '--head-dir=/tmp/head',
      '--runs=3',
      '--warmup=0',
      '--bootstrap-iterations=123',
      '--bootstrap-seed=7',
      '--fail-on-regression=false',
    ])

    expect(config.baseRef).toBeUndefined()
    expect(config.headDir).toBe('/tmp/head')
    expect(config.runs).toBe(3)
    expect(config.warmup).toBe(0)
    expect(config.bootstrapIterations).toBe(123)
    expect(config.bootstrapSeed).toBe(7)
    expect(config.failOnRegression).toBe(false)
  })

  test('rejects insufficient samples, negative thresholds, and invalid seeds', () => {
    expect(() => parseRuntimeConfig(['--runs=1'])).toThrow('at least 2')
    expect(() => parseRuntimeConfig(['--max-regression-ms=-1'])).toThrow(
      'thresholds must not be negative',
    )
    expect(() => parseRuntimeConfig(['--bootstrap-iterations=0'])).toThrow(
      'positive integer',
    )
    expect(() => parseRuntimeConfig(['--bootstrap-seed=1.5'])).toThrow(
      'bootstrap-seed must be an integer',
    )
  })

  test('identifies both page and custom-element bundles for custom scenarios', () => {
    const customElement = RUNTIME_BENCHMARK_CASES.find(
      ({ id }) => id === 'custom-element',
    )
    expect(customElement?.bundles).toEqual([
      'page.main.esm.js',
      'custom-element.main.esm.js',
    ])
  })
})
