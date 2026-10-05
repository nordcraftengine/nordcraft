/**
 * Entry point for running the issue search and autofix benchmark comparison.
 * Usage:
 *   bun benchmarks/issues.benchmark.ts
 *   bun benchmarks/issues.benchmark.ts --base-ref=origin/main
 *   bun benchmarks/issues.benchmark.ts --case=autofix-named-formulas
 */
import { main } from '../bin/runIssuesBenchmark'

await main()
