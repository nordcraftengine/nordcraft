/**
 * Project fixtures used by the test data removal compression benchmark.
 * Each fixture is a full project export stored in
 * `benchmarks/browser/fixtures`.
 */
export const COMPRESSION_BENCHMARK_FIXTURES = [
  {
    id: 'benchmark-project',
    name: 'Synthetic benchmark project',
    file: 'benchmark-project.json',
  },
  {
    id: 'nordcraft-com',
    name: 'nordcraft.com (production export)',
    file: 'nordcraft.com.json',
  },
] as const

export type CompressionBenchmarkFixtureId =
  (typeof COMPRESSION_BENCHMARK_FIXTURES)[number]['id']

export type CompressionBenchmarkFixture =
  (typeof COMPRESSION_BENCHMARK_FIXTURES)[number]

export const COMPRESSION_BENCHMARK_FIXTURE_IDS =
  COMPRESSION_BENCHMARK_FIXTURES.map((fixture) => fixture.id)

export const compressionBenchmarkUsage = () =>
  `--fixture=<${COMPRESSION_BENCHMARK_FIXTURES.map(({ id }) => id).join('|')}>`
