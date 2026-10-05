import { describe, expect, test } from 'bun:test'
import {
  isIssueBenchmarkCaseId,
  ISSUE_BENCHMARK_CASES,
  issueBenchmarkUsage,
} from './issueCases'

describe('Issues benchmark cases', () => {
  test('exposes the stable benchmark case ids', () => {
    expect(ISSUE_BENCHMARK_CASES.map(({ id }) => id)).toEqual([
      'search-nordcraft-all-rules',
      'autofix-nordcraft-named-formulas',
      'autofix-nordcraft-named-workflows',
      'autofix-named-formulas',
      'autofix-named-workflows',
    ])
    expect(isIssueBenchmarkCaseId('search-nordcraft-all-rules')).toBe(true)
    expect(isIssueBenchmarkCaseId('autofix-nordcraft-named-formulas')).toBe(
      true,
    )
    expect(isIssueBenchmarkCaseId('not-a-case')).toBe(false)
    expect(isIssueBenchmarkCaseId(undefined)).toBe(false)
  })

  test('builds usage text from the shared case list', () => {
    expect(issueBenchmarkUsage()).toBe(
      '--case=<search-nordcraft-all-rules|autofix-nordcraft-named-formulas|autofix-nordcraft-named-workflows|autofix-named-formulas|autofix-named-workflows>',
    )
  })
})
