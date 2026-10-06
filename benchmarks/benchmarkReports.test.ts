import { describe, expect, test } from 'bun:test'

import {
  isComparisonClean,
  renderMarkdown,
  SSR_COMPARISON_CLEAN_MARKDOWN,
  type BenchmarkRow,
  type CompareConfig,
} from '../bin/compareBenchmarks'
import {
  isIssuesClean,
  ISSUES_CLEAN_MARKDOWN,
  renderIssuesMarkdown,
} from '../bin/runIssuesBenchmark'
import {
  isRuntimeClean,
  renderRuntimeMarkdown,
  RUNTIME_CLEAN_MARKDOWN,
} from '../bin/runRuntimeBenchmark'
import {
  isSsrClean,
  renderSsrMarkdown,
  SSR_CLEAN_MARKDOWN,
} from '../bin/runSsrBenchmarks'

const compareConfig: CompareConfig = {
  baseDir: '/tmp/base',
  headDir: '/tmp/head',
  maxRegressionPercent: 3,
  maxRegressionMs: 1,
  noiseThresholdPercent: 1.5,
  bootstrapIterations: 100,
  bootstrapSeed: 0,
  failOnRegression: false,
  repeat: 1,
}

describe('benchmark PR comments collapse to a one-liner when 1:1', () => {
  test('SSR comparison renders one line for all-ok rows', () => {
    const rows: BenchmarkRow[] = [
      {
        caseId: 'formula',
        caseName: 'A',
        baseMedianMs: 1,
        headMedianMs: 1,
        deltaPercent: 0,
        deltaMs: 0,
        ciLowPercent: -1,
        ciHighPercent: 1,
        pValue: 0.5,
        status: 'ok' as const,
      },
    ]
    expect(isComparisonClean(rows)).toBe(true)
    expect(isComparisonClean([])).toBe(false)
    expect(isComparisonClean([{ ...rows[0], status: 'regression' }])).toBe(
      false,
    )
    expect(isComparisonClean([{ ...rows[0], status: 'improvement' }])).toBe(
      false,
    )
    expect(isComparisonClean([{ ...rows[0], status: 'inconclusive' }])).toBe(
      false,
    )

    const markdown = renderMarkdown(rows, compareConfig)
    expect(markdown).toBe(SSR_COMPARISON_CLEAN_MARKDOWN)
    expect(markdown.split('\n')).toHaveLength(1)
  })

  test('SSR comparison keeps full table on regression', () => {
    const rows: BenchmarkRow[] = [
      {
        caseId: 'formula',
        caseName: 'A',
        baseMedianMs: 1,
        headMedianMs: 2,
        deltaPercent: 100,
        deltaMs: 1,
        ciLowPercent: 90,
        ciHighPercent: 110,
        pValue: 0.001,
        status: 'regression' as const,
      },
    ]
    expect(
      renderMarkdown(rows, compareConfig).split('\n').length,
    ).toBeGreaterThan(1)
  })

  test('SSR benchmark renders one line for 1:1/stable', () => {
    const config = {
      baseRef: 'abc',
      runs: 20,
      warmup: 4,
      repeat: 1,
      noiseThresholdPercent: 1.5,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
      responseTimeoutMs: 120_000,
      bootstrapIterations: 1000,
      bootstrapSeed: 0,
      failOnRegression: true,
      skipBuild: false,
      keepWorktree: false,
    }
    const base = {
      id: 'case',
      name: 'case',
      mode: 'comparison',
      baseMedianMs: 1,
      headMedianMs: 1,
      baseIqrMs: 0.1,
      headIqrMs: 0.1,
      deltaPercent: 0,
      deltaMs: 0,
      ciLowPercent: -1,
      ciHighPercent: 1,
      pValue: 0.6,
      bootstrapIterations: 1000,
      bootstrapSeed: 0,
      timeVerdict: 'ok',
    }
    const clean = [
      { ...base, timeStatus: '1:1' },
      { ...base, timeStatus: 'stable' },
    ]
    expect(isSsrClean(clean)).toBe(true)
    expect(isSsrClean([])).toBe(false)
    expect(isSsrClean([{ timeStatus: 'regression' }])).toBe(false)
    expect(isSsrClean([{ timeStatus: 'improvement' }])).toBe(false)
    expect(isSsrClean([{ timeStatus: 'inconclusive' }])).toBe(false)

    const markdown = renderSsrMarkdown({ config, results: clean as never })
    expect(markdown).toBe(SSR_CLEAN_MARKDOWN)
    expect(markdown.split('\n')).toHaveLength(1)

    const noisy = renderSsrMarkdown({
      config,
      results: [{ ...base, timeStatus: 'regression' }] as never,
    })
    expect(noisy.split('\n').length).toBeGreaterThan(1)
  })

  test('Issues benchmark renders one line for 1:1/stable', () => {
    const config = {
      baseRef: 'abc',
      runs: 10,
      warmup: 2,
      repeat: 1,
      profile: false,
      noiseThresholdPercent: 2,
      maxRegressionPercent: 5,
      maxRegressionMs: 5,
      responseTimeoutMs: 60_000,
      bootstrapIterations: 1000,
      bootstrapSeed: 0,
      failOnRegression: false,
      skipBuild: false,
      keepWorktree: false,
    }
    const base = {
      id: 'case',
      name: 'Case',
      mode: 'comparison',
      baseMedianMs: 1,
      headMedianMs: 1,
      baseIqrMs: 0.1,
      headIqrMs: 0.1,
      deltaPercent: 0,
      deltaMs: 0,
      ciLowPercent: -1,
      ciHighPercent: 1,
      pValue: 0.6,
      bootstrapIterations: 1000,
      bootstrapSeed: 0,
      timeVerdict: 'ok',
    }
    expect(
      isIssuesClean([{ timeStatus: '1:1' }, { timeStatus: 'stable' }]),
    ).toBe(true)
    expect(isIssuesClean([])).toBe(false)
    expect(isIssuesClean([{ timeStatus: 'improvement' }])).toBe(false)
    expect(isIssuesClean([{ timeStatus: 'regression' }])).toBe(false)

    const markdown = renderIssuesMarkdown({
      config,
      results: [
        { ...base, timeStatus: '1:1' },
        { ...base, timeStatus: 'stable' },
      ] as never,
    })
    expect(markdown).toBe(ISSUES_CLEAN_MARKDOWN)
    expect(markdown.split('\n')).toHaveLength(1)
  })

  test('Runtime benchmark renders one line for 1:1/stable', () => {
    const config = {
      headDir: '/tmp/head',
      runs: 20,
      warmup: 4,
      maxRegressionPercent: 3,
      maxRegressionMs: 1,
      noiseThresholdPercent: 1.5,
      bootstrapIterations: 1000,
      bootstrapSeed: 0,
      failOnRegression: true,
    }
    const base = {
      id: 'a',
      baseMedianMs: 1,
      headMedianMs: 1,
      deltaMs: 0,
      deltaPercent: 0,
      baseHeapMedianKb: 10,
      headHeapMedianKb: 10,
      deltaHeapKb: 0,
      deltaHeapPercent: 0,
      timeVerdict: 'ok',
      heapVerdict: 'ok',
    }
    const clean = [
      { ...base, timeStatus: '1:1', heapStatus: '1:1' },
      { ...base, timeStatus: 'stable', heapStatus: 'stable' },
    ]
    expect(isRuntimeClean(clean)).toBe(true)
    expect(isRuntimeClean([])).toBe(false)
    expect(
      isRuntimeClean([{ timeStatus: '1:1', heapStatus: 'regression' }]),
    ).toBe(false)
    expect(
      isRuntimeClean([{ timeStatus: 'improvement', heapStatus: '1:1' }]),
    ).toBe(false)

    const markdown = renderRuntimeMarkdown({
      config,
      results: clean as never,
      isPageBundleIdentical: true,
      baseRuntimeBytes: 1000,
      headRuntimeBytes: 1000,
      deltaSizeStr: '0 B',
    })
    expect(markdown).toBe(RUNTIME_CLEAN_MARKDOWN)
    expect(markdown.split('\n')).toHaveLength(1)
  })
})
