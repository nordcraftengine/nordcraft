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
