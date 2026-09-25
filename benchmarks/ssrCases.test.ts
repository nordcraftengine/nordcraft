import { describe, expect, test } from 'bun:test'
import {
  isSsrBenchmarkCaseId,
  SSR_BENCHMARK_CASES,
  ssrBenchmarkUsage,
} from './ssrCases'

describe('SSR benchmark cases', () => {
  test('exposes the stable benchmark case ids', () => {
    expect(SSR_BENCHMARK_CASES.map(({ id }) => id)).toEqual([
      'formula',
      'collections-hot-path',
      'example-project-homepage',
    ])
    expect(isSsrBenchmarkCaseId('formula')).toBe(true)
    expect(isSsrBenchmarkCaseId('not-a-case')).toBe(false)
    expect(isSsrBenchmarkCaseId(undefined)).toBe(false)
  })

  test('builds usage text from the shared case list', () => {
    expect(ssrBenchmarkUsage()).toBe(
      '--case=<formula|collections-hot-path|example-project-homepage>',
    )
  })
})
