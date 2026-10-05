export const ISSUE_BENCHMARK_CASES = [
  {
    id: 'autofix-named-formulas',
    name: 'issues.autofix (rename 50 named formulas in project)',
  },
  {
    id: 'autofix-named-workflows',
    name: 'issues.autofix (rename 50 named workflows in project)',
  },
  {
    id: 'autofix-legacy-formulas',
    name: 'issues.autofix (replace 50 legacy formulas in project)',
  },
  {
    id: 'search-project-issues',
    name: 'issues.search (all issue rules on benchmark project)',
  },
] as const

export type IssueBenchmarkCaseId = (typeof ISSUE_BENCHMARK_CASES)[number]['id']

export const isIssueBenchmarkCaseId = (
  value: string | undefined,
): value is IssueBenchmarkCaseId =>
  ISSUE_BENCHMARK_CASES.some((benchmarkCase) => benchmarkCase.id === value)

export const ISSUE_BENCHMARK_CASE_IDS = ISSUE_BENCHMARK_CASES.map(
  (benchmarkCase) => benchmarkCase.id,
)

export const issueBenchmarkUsage = () =>
  `--case=<${ISSUE_BENCHMARK_CASES.map(({ id }) => id).join('|')}>`
