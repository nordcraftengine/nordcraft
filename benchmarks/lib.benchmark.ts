/**
 * Entry point for running the std-lib performance benchmark comparison.
 * Usage:
 *   bun benchmarks/lib.benchmark.ts
 *   bun benchmarks/lib.benchmark.ts --base-ref=origin/main
 *   bun benchmarks/lib.benchmark.ts --case=sum
 */
import { main } from '../bin/runLibBenchmark'

await main()
