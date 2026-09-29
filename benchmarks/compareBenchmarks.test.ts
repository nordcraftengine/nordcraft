import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  compareBenchmarkDirectories,
  main,
  parseCompareConfig,
  readSamples,
} from '../bin/compareBenchmarks'
import { SSR_BENCHMARK_CASES } from './ssrCases'

describe('SSR benchmark comparison inputs', () => {
  test('parses directory aliases and comparison options', () => {
    const config = parseCompareConfig([
      '--base=/tmp/base',
      '--head=/tmp/head',
      '--repeat=15',
      '--max-regression-percent=4.5',
      '--max-regression-ms=1.25',
      '--noise-threshold-percent=0.8',
      '--bootstrap-iterations=321',
      '--bootstrap-seed=9',
      '--fail-on-regression=false',
    ])

    expect(config).toMatchObject({
      baseDir: '/tmp/base',
      headDir: '/tmp/head',
      repeat: 15,
      maxRegressionPercent: 4.5,
      maxRegressionMs: 1.25,
      noiseThresholdPercent: 0.8,
      bootstrapIterations: 321,
      bootstrapSeed: 9,
      failOnRegression: false,
    })
    expect(() => parseCompareConfig(['--base=/tmp/base'])).toThrow('Usage:')
    expect(() =>
      parseCompareConfig([
        '--base=/tmp/base',
        '--head=/tmp/head',
        '--repeat=0',
      ]),
    ).toThrow('positive integer')
    expect(() =>
      parseCompareConfig([
        '--base=/tmp/base',
        '--head=/tmp/head',
        '--bootstrap-iterations=0',
      ]),
    ).toThrow('positive integer')
    expect(() =>
      parseCompareConfig([
        '--base=/tmp/base',
        '--head=/tmp/head',
        '--bootstrap-seed=1.5',
      ]),
    ).toThrow('bootstrap-seed must be an integer')
  })

  test('keeps normalized unified samples and converts legacy Hyperfine samples', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nordcraft-compare-test-'))
    try {
      const unifiedPath = join(directory, 'unified.json')
      const legacyPath = join(directory, 'legacy.json')
      await Bun.write(unifiedPath, JSON.stringify({ timesMs: [1, 2, 3] }))
      await Bun.write(
        legacyPath,
        JSON.stringify({ results: [{ times: [0.015, 0.03] }] }),
      )

      expect(await readSamples(unifiedPath, 15)).toEqual([1, 2, 3])
      expect(await readSamples(legacyPath, 15)).toEqual([1, 2])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  test('treats missing and malformed samples as unavailable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nordcraft-compare-test-'))
    try {
      const malformedPath = join(directory, 'malformed.json')
      const invalidSamplesPath = join(directory, 'invalid-samples.json')
      await Bun.write(malformedPath, '{not valid json')
      await Bun.write(invalidSamplesPath, JSON.stringify({ timesMs: [-1] }))
      expect(
        await readSamples(join(directory, 'missing.json'), 1),
      ).toBeUndefined()
      expect(await readSamples(malformedPath, 1)).toBeUndefined()
      expect(await readSamples(invalidSamplesPath, 1)).toBeUndefined()
      expect(await readSamples(invalidSamplesPath, 0)).toBeUndefined()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  test('fails standalone comparisons for missing or one-sample data even when regression gating is disabled', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nordcraft-compare-main-'))
    const base = join(directory, 'base')
    const head = join(directory, 'head')
    await mkdir(base, { recursive: true })
    await mkdir(head, { recursive: true })

    try {
      const output = join(directory, 'report.md')
      await expect(
        main([
          `--base-dir=${base}`,
          `--head-dir=${head}`,
          `--output=${output}`,
          '--fail-on-regression=false',
        ]),
      ).rejects.toThrow('comparison unavailable')

      for (const benchmarkCase of SSR_BENCHMARK_CASES) {
        await Bun.write(
          join(base, `${benchmarkCase.id}.json`),
          JSON.stringify({ timesMs: [1] }),
        )
        await Bun.write(
          join(head, `${benchmarkCase.id}.json`),
          JSON.stringify({ timesMs: [1] }),
        )
      }
      const result = await compareBenchmarkDirectories({
        baseDir: base,
        headDir: head,
        repeat: 1,
        maxRegressionPercent: 3,
        maxRegressionMs: 1,
        noiseThresholdPercent: 1.5,
        bootstrapIterations: 100,
        bootstrapSeed: 0,
        failOnRegression: false,
      })
      expect(
        result.rows.every((row) => row.status === 'insufficient-base'),
      ).toBe(true)

      const constantCase = SSR_BENCHMARK_CASES[0]
      await Bun.write(
        join(base, `${constantCase.id}.json`),
        JSON.stringify({ timesMs: [2, 2, 2] }),
      )
      await Bun.write(
        join(head, `${constantCase.id}.json`),
        JSON.stringify({ timesMs: [3, 4, 5] }),
      )
      const constantResult = await compareBenchmarkDirectories({
        baseDir: base,
        headDir: head,
        repeat: 1,
        maxRegressionPercent: 3,
        maxRegressionMs: 1,
        noiseThresholdPercent: 1.5,
        bootstrapIterations: 100,
        bootstrapSeed: 0,
        failOnRegression: false,
      })
      expect(constantResult.rows[0].status).toBe('inconclusive')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
