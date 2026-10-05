import { describe, expect, test } from 'bun:test'
import {
  isIssueBenchmarkCaseId,
  ISSUE_BENCHMARK_CASES,
  issueBenchmarkUsage,
} from './issueCases'

describe('Issues benchmark cases', () => {
  test('exposes the stable benchmark case ids', () => {
    expect(ISSUE_BENCHMARK_CASES.map(({ id }) => id)).toEqual([
      'autofix-named-formulas',
      'autofix-named-workflows',
      'autofix-legacy-formulas',
      'search-project-issues',
    ])
    expect(isIssueBenchmarkCaseId('autofix-named-formulas')).toBe(true)
    expect(isIssueBenchmarkCaseId('not-a-case')).toBe(false)
    expect(isIssueBenchmarkCaseId(undefined)).toBe(false)
  })

  test('builds usage text from the shared case list', () => {
    expect(issueBenchmarkUsage()).toBe(
      '--case=<autofix-named-formulas|autofix-named-workflows|autofix-legacy-formulas|search-project-issues>',
    )
  })
})
