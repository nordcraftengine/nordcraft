export const ISSUE_BENCHMARK_CASES = [
  {
    id: 'search-nordcraft-all-rules',
    name: 'issues.search (all rules on real-world nordcraft.com project)',
  },
  {
    id: 'autofix-nordcraft-named-formulas',
    name: 'issues.autofix (rename 86 named formulas in real nordcraft.com project)',
  },
  {
    id: 'autofix-nordcraft-named-workflows',
    name: 'issues.autofix (rename 14 named workflows in real nordcraft.com project)',
  },
  {
    id: 'autofix-named-formulas',
    name: 'issues.autofix (rename 50 named formulas in benchmark project)',
  },
  {
    id: 'autofix-named-workflows',
    name: 'issues.autofix (rename 50 named workflows in benchmark project)',
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
