/* eslint-disable no-console */
/**
 * Measures how much smaller fixture projects become once editor-only test
 * data has been removed. Runs inside a checkout (head or base worktree) so
 * the `removeTestData` implementation of that revision is measured.
 *
 * Usage:
 *   bun bin/compressionBenchmark.ts --json
 *   bun bin/compressionBenchmark.ts --fixture=nordcraft-com --output=result.json
 */
import {
  getBoolean,
  getOptionalString,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  measureProjectFiles,
  type CompressionFixtureResult,
} from '../benchmarks/compression'
import {
  COMPRESSION_BENCHMARK_FIXTURES,
  compressionBenchmarkUsage,
} from '../benchmarks/compressionCases'
import { removeTestData } from '../packages/ssr/dist/rendering/testData'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'

type BenchmarkProject = {
  files: ProjectFiles
}

export const loadFixtureResult = async (
  fixture: { id: string; name: string; file: string },
  fixturesDir: URL,
): Promise<CompressionFixtureResult> => {
  const project = (await Bun.file(
    new URL(fixture.file, fixturesDir),
  ).json()) as BenchmarkProject
  return {
    id: fixture.id,
    name: fixture.name,
    ...measureProjectFiles(project.files, removeTestData),
  }
}

export const measureFixtures = async (
  fixturesDir: URL = new URL(
    '../benchmarks/browser/fixtures/',
    import.meta.url,
  ),
  onlyFixtureIds?: readonly string[],
): Promise<CompressionFixtureResult[]> => {
  const fixtures = onlyFixtureIds
    ? COMPRESSION_BENCHMARK_FIXTURES.filter(({ id }) =>
        onlyFixtureIds.includes(id),
      )
    : COMPRESSION_BENCHMARK_FIXTURES
  const results: CompressionFixtureResult[] = []
  for (const fixture of fixtures) {
    results.push(await loadFixtureResult(fixture, fixturesDir))
  }
  return results
}

export const main = async (argv: readonly string[] = Bun.argv.slice(2)) => {
  const args = parseBenchmarkArgs(argv)
  const requestedFixtures = getOptionalString(args, '--fixtures')
  const onlyFixtureIds = requestedFixtures?.split(',').filter(Boolean)
  const unknownFixtureId = onlyFixtureIds?.find(
    (id) =>
      !COMPRESSION_BENCHMARK_FIXTURES.some((fixture) => fixture.id === id),
  )
  if (unknownFixtureId) {
    throw new Error(
      `Unknown fixture "${unknownFixtureId}". Usage: bun bin/compressionBenchmark.ts ${compressionBenchmarkUsage()}`,
    )
  }
  const json = getBoolean(args, '--json', false)
  const outputPath = getOptionalString(args, '--output')

  const results = await measureFixtures(undefined, onlyFixtureIds)
  const payload = { results }

  if (outputPath) {
    await Bun.write(outputPath, `${JSON.stringify(payload, null, 2)}\n`)
  } else if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`)
  } else {
    for (const result of results) {
      console.log(
        `${result.id}: ${result.originalBytes} B -> ${result.strippedBytes} B (${result.reductionPercent.toFixed(2)}% smaller, gzip ${result.originalGzipBytes} B -> ${result.strippedGzipBytes} B, ${result.gzipReductionPercent.toFixed(2)}% smaller, ${result.componentCount} components)`,
      )
    }
  }
}

if (import.meta.main) {
  await main()
}
