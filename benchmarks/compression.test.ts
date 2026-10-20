import { describe, expect, test } from 'bun:test'

import type { Component } from '../packages/core/dist/component/component.types'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'
import {
  isCompressionClean,
  measureProjectFiles,
  renderCompressionMarkdown,
  summarizeCompressionBenchmark,
  type CompressionFixtureResult,
} from './compression'
import { COMPRESSION_BENCHMARK_FIXTURES } from './compressionCases'

const stripTestData = (component: Component): Component =>
  JSON.parse(
    JSON.stringify(component, (key, value) =>
      key === 'testValue' ? undefined : value,
    ),
  ) as Component

const createFiles = (): ProjectFiles =>
  ({
    components: {
      HomePage: {
        name: 'HomePage',
        nodes: {
          root: {
            type: 'text',
            value: 'Hello',
            testValue: 'editor-only test data that is shipped by mistake',
          },
        },
        attributes: {
          title: { testValue: 'a very long default attribute test value' },
        },
      },
    },
    packages: {
      shared: {
        manifest: { name: 'shared' },
        components: {
          shared: {
            name: 'shared/Card',
            nodes: {},
            events: { click: { dummyEvent: true } },
          },
        },
      },
    },
  }) as unknown as ProjectFiles

const createResult = (
  overrides: Partial<CompressionFixtureResult> = {},
): CompressionFixtureResult => ({
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
  ...overrides,
})

describe('measureProjectFiles', () => {
  test('measures the size reduction from stripping test data', () => {
    const metrics = measureProjectFiles(createFiles(), stripTestData)

    expect(metrics.componentCount).toBe(2)
    expect(metrics.originalBytes).toBeGreaterThan(metrics.strippedBytes)
    expect(metrics.savedBytes).toBe(
      metrics.originalBytes - metrics.strippedBytes,
    )
    expect(metrics.reductionPercent).toBeCloseTo(
      (metrics.savedBytes / metrics.originalBytes) * 100,
    )
    expect(metrics.originalGzipBytes).toBeGreaterThan(metrics.strippedGzipBytes)
    expect(metrics.gzipSavedBytes).toBe(
      metrics.originalGzipBytes - metrics.strippedGzipBytes,
    )
    expect(metrics.gzipReductionPercent).toBeGreaterThan(0)
  })

  test('reports no reduction when the stripper is a no-op', () => {
    const metrics = measureProjectFiles(
      createFiles(),
      (component: Component) => component,
    )

    expect(metrics.savedBytes).toBe(0)
    expect(metrics.reductionPercent).toBe(0)
    expect(metrics.gzipSavedBytes).toBe(0)
  })
})

describe('summarizeCompressionBenchmark', () => {
  const summarize = ({
    baseResults,
    headResults,
    noiseThresholdPercent = 0.05,
    maxRegressionPercent = 0.5,
  }: {
    baseResults: CompressionFixtureResult[] | undefined
    headResults: CompressionFixtureResult[]
    noiseThresholdPercent?: number
    maxRegressionPercent?: number
  }) =>
    summarizeCompressionBenchmark({
      baseResults,
      headResults,
      noiseThresholdPercent,
      maxRegressionPercent,
    })

  test('marks head-only runs as a baseline', () => {
    const [summary] = summarize({
      baseResults: undefined,
      headResults: [createResult()],
    })

    expect(summary.mode).toBe('head-only')
    expect(summary.status).toBe('1:1')
    expect(summary.verdict).toContain('Baseline')
  })

  test('treats identical output as 1:1', () => {
    const [summary] = summarize({
      baseResults: [createResult()],
      headResults: [createResult()],
    })

    expect(summary.status).toBe('1:1')
    expect(summary.verdict).toContain('Identical')
  })

  test('flags a larger stripped project as a regression', () => {
    const [summary] = summarize({
      baseResults: [createResult()],
      headResults: [createResult({ strippedBytes: 600, savedBytes: 400 })],
    })

    expect(summary.status).toBe('regression')
    expect(summary.deltaStrippedBytes).toBe(100)
    expect(summary.deltaStrippedPercent).toBeCloseTo(20)
    expect(summary.verdict).toContain('larger')
  })

  test('flags a smaller stripped project as an improvement', () => {
    const [summary] = summarize({
      baseResults: [createResult()],
      headResults: [createResult({ strippedBytes: 400, savedBytes: 600 })],
    })

    expect(summary.status).toBe('improvement')
    expect(summary.deltaStrippedBytes).toBe(-100)
    expect(summary.verdict).toContain('smaller')
  })

  test('ignores changes within the noise threshold', () => {
    const [summary] = summarize({
      baseResults: [createResult()],
      headResults: [createResult({ strippedBytes: 500.1, savedBytes: 499.9 })],
    })

    expect(summary.status).toBe('1:1')
  })
})

describe('isCompressionClean', () => {
  test('accepts 1:1 and stable only', () => {
    expect(isCompressionClean([{ status: '1:1' }, { status: 'stable' }])).toBe(
      true,
    )
    expect(isCompressionClean([])).toBe(false)
    expect(isCompressionClean([{ status: 'improvement' }])).toBe(false)
    expect(isCompressionClean([{ status: 'regression' }])).toBe(false)
  })
})

describe('renderCompressionMarkdown', () => {
  const config = {
    baseRef: 'abc',
    noiseThresholdPercent: 0.05,
    maxRegressionPercent: 0.5,
  }

  test('always includes the compression rate even when 1:1 with base', () => {
    const [summary] = summarizeCompressionBenchmark({
      baseResults: [createResult()],
      headResults: [createResult()],
      noiseThresholdPercent: 0.05,
      maxRegressionPercent: 0.5,
    })

    const markdown = renderCompressionMarkdown({ config, results: [summary] })
    expect(markdown.split('\n').length).toBeGreaterThan(1)
    expect(markdown).toContain(summary.id)
    expect(markdown).toContain(`${summary.reductionPercent.toFixed(2)}%`)
    expect(markdown).toContain(`${summary.gzipReductionPercent.toFixed(2)}%`)
    expect(markdown).toContain('🟢 1:1 (Identical output)')
    expect(markdown).toContain('No regressions detected')
  })

  test('keeps the table when a fixture regresses', () => {
    const [summary] = summarizeCompressionBenchmark({
      baseResults: [createResult()],
      headResults: [createResult({ strippedBytes: 900, savedBytes: 100 })],
      noiseThresholdPercent: 0.05,
      maxRegressionPercent: 0.5,
    })

    const markdown = renderCompressionMarkdown({ config, results: [summary] })
    expect(markdown.split('\n').length).toBeGreaterThan(1)
    expect(markdown).toContain(summary.id)
  })

  test('keeps the table for a head-only baseline', () => {
    const [summary] = summarizeCompressionBenchmark({
      baseResults: undefined,
      headResults: [createResult()],
      noiseThresholdPercent: 0.05,
      maxRegressionPercent: 0.5,
    })

    const markdown = renderCompressionMarkdown({
      config: { ...config, baseRef: undefined },
      results: [summary],
    })
    expect(markdown.split('\n').length).toBeGreaterThan(1)
    expect(markdown).toContain('head-only baseline')
  })
})

describe('compression benchmark fixtures', () => {
  test('exposes unique fixture ids backed by json files', () => {
    const ids = COMPRESSION_BENCHMARK_FIXTURES.map((fixture) => fixture.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const fixture of COMPRESSION_BENCHMARK_FIXTURES) {
      expect(fixture.file).toEndWith('.json')
    }
  })
})
