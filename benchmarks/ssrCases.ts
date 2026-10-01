export const SSR_BENCHMARK_CASES = [
  {
    id: 'formula',
    name: 'core.applyFormula (complex mix, 3k evals)',
  },
  {
    id: 'collections-hot-path',
    name: 'ssr.renderPageBody (collections hot path)',
  },
  {
    id: 'example-project-homepage',
    name: 'ssr.renderPageBody (example project HomePage)',
  },
  {
    id: 'example-pricing-page',
    name: "ssr.renderPageBody (example project pricing page, inspired by runtime 'mount-pricing')",
  },
  {
    id: 'repeat-large-list',
    name: "ssr.renderPageBody (200-item repeat list, inspired by runtime 'list-repeat')",
  },
  {
    id: 'style-variables',
    name: "ssr.renderPageBody (200 nodes with dynamic custom properties, inspired by runtime 'style-variables')",
  },
  {
    id: 'context-propagation',
    name: "ssr.renderPageBody (200 context consumers, inspired by runtime 'context-propagation')",
  },
  {
    id: 'conditional-subtree',
    name: "ssr.renderPageBody (conditional subtree with nested components, inspired by runtime 'lifecycle-churn')",
  },
] as const

export type SsrBenchmarkCaseId = (typeof SSR_BENCHMARK_CASES)[number]['id']

export const isSsrBenchmarkCaseId = (
  value: string | undefined,
): value is SsrBenchmarkCaseId =>
  SSR_BENCHMARK_CASES.some((benchmarkCase) => benchmarkCase.id === value)

export const SSR_BENCHMARK_CASE_IDS = SSR_BENCHMARK_CASES.map(
  (benchmarkCase) => benchmarkCase.id,
)

export const ssrBenchmarkUsage = () =>
  `--case=<${SSR_BENCHMARK_CASES.map(({ id }) => id).join('|')}>`
