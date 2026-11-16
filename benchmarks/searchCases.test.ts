import { describe, expect, test } from 'bun:test'
import {
  isSearchBenchmarkCaseId,
  SEARCH_BENCHMARK_CASES,
  searchBenchmarkUsage,
} from './searchCases'

describe('Search benchmark cases', () => {
  test('exposes the stable benchmark case ids', () => {
    expect({
      ids: SEARCH_BENCHMARK_CASES.map(({ id }) => id),
      validFreetext: isSearchBenchmarkCaseId('freetext-nordcraft'),
      validReference: isSearchBenchmarkCaseId('reference-nordcraft'),
      invalidName: isSearchBenchmarkCaseId('not-a-case'),
      invalidUndefined: isSearchBenchmarkCaseId(undefined),
    }).toEqual({
      ids: [
        'freetext-nordcraft',
        'regex-nordcraft',
        'selector-nordcraft',
        'reference-nordcraft',
        'all-queries-nordcraft',
      ],
      validFreetext: true,
      validReference: true,
      invalidName: false,
      invalidUndefined: false,
    })
  })

  test('builds usage text from the shared case list', () => {
    expect(searchBenchmarkUsage()).toBe(
      '--case=<freetext-nordcraft|regex-nordcraft|selector-nordcraft|reference-nordcraft|all-queries-nordcraft>',
    )
  })
})
