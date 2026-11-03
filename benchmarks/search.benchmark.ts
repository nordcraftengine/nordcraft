/**
 * Entry point for running the project search benchmark comparison.
 * Usage:
 *   bun benchmarks/search.benchmark.ts
 *   bun benchmarks/search.benchmark.ts --base-ref=origin/main
 *   bun benchmarks/search.benchmark.ts --case=reference-nordcraft
 */
import { main } from '../bin/runSearchBenchmark'

await main()
