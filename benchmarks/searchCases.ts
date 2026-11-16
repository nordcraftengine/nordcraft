export const SEARCH_BENCHMARK_CASES = [
  {
    id: 'freetext-nordcraft',
    name: 'search.freetext (plain text search on real-world nordcraft.com project)',
  },
  {
    id: 'regex-nordcraft',
    name: 'search.regex (regex search on real-world nordcraft.com project)',
  },
  {
    id: 'selector-nordcraft',
    name: 'search.selector (DOM node selector <img[alt]> on real-world nordcraft.com project)',
  },
  {
    id: 'reference-nordcraft',
    name: 'search.reference (component, formula, workflow, event & variable references on nordcraft.com)',
  },
  {
    id: 'all-queries-nordcraft',
    name: 'search.suite (combined freetext, selector, reference, and scoped queries on nordcraft.com)',
  },
] as const

export type SearchBenchmarkCaseId =
  (typeof SEARCH_BENCHMARK_CASES)[number]['id']

export const isSearchBenchmarkCaseId = (
  value: string | undefined,
): value is SearchBenchmarkCaseId =>
  SEARCH_BENCHMARK_CASES.some((benchmarkCase) => benchmarkCase.id === value)

export const SEARCH_BENCHMARK_CASE_IDS = SEARCH_BENCHMARK_CASES.map(
  (benchmarkCase) => benchmarkCase.id,
)

export const searchBenchmarkUsage = () =>
  `--case=<${SEARCH_BENCHMARK_CASES.map(({ id }) => id).join('|')}>`

export const PROFILE_SEARCH_QUERIES: ReadonlyArray<{
  query: string
  category: 'Freetext' | 'Selector' | 'Reference' | 'Scoped / Type'
}> = [
  { query: 'nordcraft', category: 'Freetext' },
  { query: '"This page is gone"', category: 'Freetext' },
  { query: '/nordcraft/i', category: 'Freetext' },
  { query: '<div>', category: 'Selector' },
  { query: '<img[alt]>', category: 'Selector' },
  { query: '<img> -<[alt]>', category: 'Selector' },
  { query: '<[style:display=flex]>', category: 'Selector' },
  { query: '@component:nc-', category: 'Reference' },
  { query: '@component:"nc-heading-1"', category: 'Reference' },
  { query: '@component:*heading*', category: 'Reference' },
  { query: '@formula:equals', category: 'Reference' },
  { query: '@formula:"404"/myFormula', category: 'Reference' },
  { query: '@workflow:"404"/myWorkflow', category: 'Reference' },
  { query: '@workflow:404/myWorkflow', category: 'Reference' },
  { query: '@context:"404"/myWorkflow', category: 'Reference' },
  { query: '@var:isOpen', category: 'Reference' },
  { query: '@attr:"nc-heading-1"/text', category: 'Reference' },
  { query: '@event:click', category: 'Reference' },
  { query: '@event:*', category: 'Reference' },
  { query: '@css:--grey-900', category: 'Reference' },
  { query: 'is:page', category: 'Scoped / Type' },
  { query: 'in:"404" <div>', category: 'Scoped / Type' },
]
