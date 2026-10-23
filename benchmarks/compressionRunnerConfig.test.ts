import { describe, expect, test } from 'bun:test'

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  COMPRESSION_BENCHMARK_ASSETS,
  parseConfig,
  parseMeasurementOutput,
} from '../bin/runCompressionBenchmark'
import { repositoryRoot } from './worktree'

describe('compression benchmark runner configuration', () => {
  test('defaults to origin/main with deterministic thresholds', () => {
    const config = parseConfig([])

    expect(config.baseRef).toBe('origin/main')
    expect(config.noiseThresholdPercent).toBe(0.05)
    expect(config.maxRegressionPercent).toBe(0.5)
    expect(config.failOnRegression).toBe(true)
    expect(config.skipBuild).toBe(false)
  })

  test('supports an explicit head-only run', () => {
    const config = parseConfig(['--base-ref=', '--skip-build=true'])

    expect(config.baseRef).toBeUndefined()
    expect(config.skipBuild).toBe(true)
  })

  test('rejects negative thresholds and incompatible build options', () => {
    expect(() => parseConfig(['--noise-threshold-percent=-1'])).toThrow(
      'Benchmark thresholds must not be negative',
    )
    expect(() => parseConfig(['--max-regression-percent=-1'])).toThrow(
      'Benchmark thresholds must not be negative',
    )
    expect(() =>
      parseConfig(['--base-ref=HEAD~1', '--skip-build=true']),
    ).toThrow('--skip-build=true is not supported')
  })
})

describe('parseMeasurementOutput', () => {
  const validResult = {
    id: 'fixture',
    name: 'Fixture',
    componentCount: 1,
    originalBytes: 1000,
    strippedBytes: 500,
    savedBytes: 500,
    reductionPercent: 50,
    originalGzipBytes: 400,
    strippedGzipBytes: 200,
    gzipSavedBytes: 200,
    gzipReductionPercent: 50,
  }

  test('accepts valid measurement payloads', () => {
    expect(
      parseMeasurementOutput(JSON.stringify({ results: [validResult] })),
    ).toEqual([validResult])
  })

  test('rejects malformed payloads', () => {
    expect(() => parseMeasurementOutput('not json')).toThrow(
      'Invalid compression benchmark output',
    )
    expect(() => parseMeasurementOutput('{}')).toThrow(
      'Invalid compression benchmark output',
    )
    expect(() =>
      parseMeasurementOutput(
        JSON.stringify({ results: [{ ...validResult, strippedBytes: '500' }] }),
      ),
    ).toThrow('Invalid compression benchmark fixture result')
  })
})

describe('compression benchmark assets', () => {
  test('every asset that is copied into the base worktree exists', () => {
    for (const asset of COMPRESSION_BENCHMARK_ASSETS) {
      expect(existsSync(resolve(repositoryRoot, asset))).toBe(true)
    }
  })
})
