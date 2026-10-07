import { describe, expect, test } from 'bun:test'
import { createRunner, parseLibArgs } from '../bin/libBenchmark'
import {
  isWorkerResponse,
  parseConfig,
  resolveCasesToRun,
} from '../bin/runLibBenchmark'
import { LIB_BENCHMARK_CASES, SKIPPED_LIB_BENCHMARK_CASE_IDS } from './libCases'

describe('Lib benchmark runner configuration', () => {
  test('uses origin/main and statistically meaningful defaults', () => {
    const config = parseConfig([])

    expect(config.baseRef).toBe('origin/main')
    expect(config.runs).toBe(15)
    expect(config.warmup).toBe(3)
    expect(config.repeat).toBe(5)
    expect(config.maxRegressionPercent).toBe(5)
    expect(config.maxRegressionMs).toBe(0.5)
    expect(config.noiseThresholdPercent).toBe(2)
    expect(config.responseTimeoutMs).toBe(120_000)
    expect(config.bootstrapIterations).toBe(1000)
    expect(config.bootstrapSeed).toBe(0)
    expect(config.includeSkipped).toBe(false)
  })

  test('parses the include-skipped flag', () => {
    expect(parseConfig(['--include-skipped=true']).includeSkipped).toBe(true)
    expect(parseConfig(['--include-skipped=false']).includeSkipped).toBe(false)
    expect(() => parseConfig(['--include-skipped=yes'])).toThrow(
      'must be true or false',
    )
  })

  test('skips thin-passthrough cases by default but runs them on demand', () => {
    const skippedCount = SKIPPED_LIB_BENCHMARK_CASE_IDS.length
    expect(skippedCount).toBeGreaterThan(0)

    const defaults = resolveCasesToRun({
      caseId: undefined,
      includeSkipped: false,
    })
    expect(defaults.length).toBe(LIB_BENCHMARK_CASES.length - skippedCount)
    expect(defaults.some(({ id }) => id === 'formula-minus')).toBe(false)
    expect(defaults.some(({ id }) => id === 'formula-filter')).toBe(true)

    const explicit = resolveCasesToRun({
      caseId: 'formula-minus',
      includeSkipped: false,
    })
    expect(explicit.map(({ id }) => id)).toEqual(['formula-minus'])

    const all = resolveCasesToRun({
      caseId: undefined,
      includeSkipped: true,
    })
    expect(all.length).toBe(LIB_BENCHMARK_CASES.length)
  })

  test('supports a single-case and head-only run', () => {
    const config = parseConfig([
      '--base-ref=',
      '--skip-build=true',
      '--case=formula-sum',
      '--runs=3',
      '--warmup=0',
      '--repeat=1',
    ])

    expect(config.baseRef).toBeUndefined()
    expect(config.caseId).toBe('formula-sum')
    expect(config.skipBuild).toBe(true)
    expect(config.runs).toBe(3)
    expect(config.warmup).toBe(0)
  })

  test('rejects unknown cases and invalid thresholds', () => {
    expect(() => parseConfig(['--case=not-a-formula'])).toThrow(
      'Unknown lib benchmark case',
    )
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

  test('validates worker response shapes', () => {
    expect(isWorkerResponse({ timeMs: 12.5 })).toBe(true)
    expect(isWorkerResponse({ error: 'render failed' })).toBe(true)
    expect(isWorkerResponse({ timeMs: Number.NaN })).toBe(false)
    expect(isWorkerResponse({ timeMs: -1 })).toBe(false)
    expect(isWorkerResponse({ timeMs: 0 })).toBe(false)
    expect(isWorkerResponse({ timeMs: 1, error: 'ambiguous' })).toBe(false)
    expect(isWorkerResponse(null)).toBe(false)
  })

  test('parses direct lib runner args', () => {
    const options = parseLibArgs(['--case=formula-sum', '--repeat=2'])
    expect(options.caseId).toBe('formula-sum')
    expect(options.repeat).toBe(2)
    expect(() => parseLibArgs(['--case=nope'])).toThrow('Usage:')
    expect(() => parseLibArgs([])).toThrow('Usage:')
  })
})

describe('Lib benchmark runners', () => {
  test(
    'creates a runnable benchmark for every case',
    async () => {
      for (const { id } of LIB_BENCHMARK_CASES) {
        const runner = await createRunner(id)
        expect(typeof runner.iterations).toBe('number')
        expect(runner.iterations).toBeGreaterThanOrEqual(1)
        expect(typeof runner.run).toBe('function')
        await runner.run()
      }
    },
    { timeout: 120_000 },
  )
})
