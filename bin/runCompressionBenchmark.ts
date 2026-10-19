/* eslint-disable no-console */
import { existsSync, mkdirSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import {
  getBoolean,
  getNumber,
  getOptionalString,
  parseBenchmarkArgs,
} from '../benchmarks/cli'
import {
  isCompressionClean,
  renderCompressionMarkdown,
  summarizeCompressionBenchmark,
  type CompressionFixtureResult,
} from '../benchmarks/compression'
import { COMPRESSION_BENCHMARK_FIXTURES } from '../benchmarks/compressionCases'
import {
  copyAssetsToWorktree,
  removeBenchmarkWorktree,
  repositoryRoot,
  runCommand,
} from '../benchmarks/worktree'

export const COMPRESSION_BENCHMARK_ASSETS = [
  'bin/compressionBenchmark.ts',
  'benchmarks/cli.ts',
  'benchmarks/compression.ts',
  'benchmarks/compressionCases.ts',
  'benchmarks/stats.ts',
  'benchmarks/worktree.ts',
  'benchmarks/browser/fixtures/benchmark-project.json',
  'benchmarks/browser/fixtures/nordcraft.com.json',
] as const

const REQUIRED_HEAD_ARTIFACTS = [
  'packages/core/dist/component/component.types.js',
  'packages/ssr/dist/rendering/testData.js',
]

export type Config = {
  baseRef?: string
  noiseThresholdPercent: number
  maxRegressionPercent: number
  failOnRegression: boolean
  skipBuild: boolean
  outputDir?: string
  keepWorktree: boolean
  exportJson?: string
  exportMarkdown?: string
}

export const parseConfig = (argv: readonly string[] = Bun.argv.slice(2)) => {
  const args = parseBenchmarkArgs(argv)
  const baseRefArg = args.get('--base-ref')
  const baseRef =
    baseRefArg === undefined
      ? 'origin/main'
      : baseRefArg.length > 0
        ? baseRefArg
        : undefined
  const config: Config = {
    baseRef,
    noiseThresholdPercent: getNumber(args, '--noise-threshold-percent', 0.05),
    maxRegressionPercent: getNumber(args, '--max-regression-percent', 0.5),
    failOnRegression: getBoolean(args, '--fail-on-regression', true),
    skipBuild: getBoolean(args, '--skip-build', false),
    outputDir: getOptionalString(args, '--output-dir'),
    keepWorktree: getBoolean(args, '--keep-worktree', false),
    exportJson: getOptionalString(args, '--export-json'),
    exportMarkdown: getOptionalString(args, '--export-markdown'),
  }

  if (config.baseRef && config.skipBuild) {
    throw new Error(
      '--skip-build=true is not supported together with --base-ref. The base worktree needs dependencies and compiled dist files.',
    )
  }

  if (config.noiseThresholdPercent < 0 || config.maxRegressionPercent < 0) {
    throw new Error('Benchmark thresholds must not be negative')
  }

  return config
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFixtureResult = (value: unknown): value is CompressionFixtureResult => {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.componentCount === 'number' &&
    typeof value.originalBytes === 'number' &&
    typeof value.strippedBytes === 'number' &&
    typeof value.savedBytes === 'number' &&
    typeof value.reductionPercent === 'number' &&
    typeof value.originalGzipBytes === 'number' &&
    typeof value.strippedGzipBytes === 'number' &&
    typeof value.gzipSavedBytes === 'number' &&
    typeof value.gzipReductionPercent === 'number'
  )
}

export const parseMeasurementOutput = (
  output: string,
): CompressionFixtureResult[] => {
  let payload: unknown
  try {
    payload = JSON.parse(output) as unknown
  } catch (error) {
    throw new Error(`Invalid compression benchmark output: ${output}`, {
      cause: error,
    })
  }
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new Error(`Invalid compression benchmark output: ${output}`)
  }
  if (!payload.results.every(isFixtureResult)) {
    throw new Error(`Invalid compression benchmark fixture result: ${output}`)
  }
  return payload.results
}

const preflightBuiltArtifacts = (cwd: string) => {
  const missing = REQUIRED_HEAD_ARTIFACTS.filter(
    (artifact) => !existsSync(resolve(cwd, artifact)),
  )
  if (missing.length > 0) {
    throw new Error(
      `Missing built compression benchmark artifacts in ${cwd}: ${missing.join(', ')}. Run 'bun run build' before benchmarking.`,
    )
  }
}

export const measureCheckout = (
  cwd: string,
  fixtureIds: readonly string[],
): CompressionFixtureResult[] => {
  preflightBuiltArtifacts(cwd)
  const result = Bun.spawnSync(
    [
      'bun',
      'bin/compressionBenchmark.ts',
      '--json',
      `--fixtures=${fixtureIds.join(',')}`,
    ],
    {
      cwd,
      stdout: 'pipe',
      stderr: 'inherit',
    },
  )
  if (result.exitCode !== 0) {
    throw new Error(
      `Compression benchmark measurement failed in ${cwd} (exit ${result.exitCode})`,
    )
  }
  return parseMeasurementOutput(result.stdout.toString())
}

const fixtureIds = COMPRESSION_BENCHMARK_FIXTURES.map((fixture) => fixture.id)

const writeReport = async ({
  config,
  results,
  markdownPath,
  jsonPath,
}: {
  config: Config
  results: ReturnType<typeof summarizeCompressionBenchmark>
  markdownPath: string
  jsonPath: string
}) => {
  const hasRegressions = results.some(
    (result) => result.status === 'regression',
  )
  const hasInconclusive = results.some(
    (result) => !Number.isFinite(result.reductionPercent),
  )
  const markdown = renderCompressionMarkdown({ config, results })

  mkdirSync(dirname(markdownPath), { recursive: true })
  mkdirSync(dirname(jsonPath), { recursive: true })
  await Bun.write(markdownPath, `${markdown}\n`)
  await Bun.write(
    jsonPath,
    `${JSON.stringify(
      {
        status: hasRegressions
          ? 'regression'
          : hasInconclusive
            ? 'inconclusive'
            : 'pass',
        config,
        results,
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    '\n================================ COMPRESSION BENCHMARK RESULTS ================================',
  )
  console.log(
    'Fixture'.padEnd(24) +
      'After removal'.padStart(16) +
      'Saved'.padStart(16) +
      'Reduction'.padStart(14) +
      '  Verdict',
  )
  console.log('-'.repeat(100))
  for (const result of results) {
    console.log(
      result.id.padEnd(24) +
        `${result.strippedBytes} B`.padStart(16) +
        `${result.savedBytes} B`.padStart(16) +
        `${result.reductionPercent.toFixed(2)}%`.padStart(14) +
        `  ${result.verdict}`,
    )
  }
  console.log(
    '===============================================================================================\n',
  )
  console.log(`Markdown report written to: ${markdownPath}`)
  console.log(`JSON report written to: ${jsonPath}`)

  if (hasRegressions && config.failOnRegression) {
    const regressions = results
      .filter((result) => result.status === 'regression')
      .map((result) => `${result.id}: ${result.verdict}`)
      .join(', ')
    throw new Error(
      `Compression benchmark regression above threshold: ${regressions}`,
    )
  }
}

const main = async () => {
  const config = parseConfig()
  const outputRoot = config.outputDir
    ? resolve(repositoryRoot, config.outputDir)
    : await mkdtemp(join(tmpdir(), 'nordcraft-compression-bench-'))
  const baseWorktreePath = join(outputRoot, 'base-worktree')

  console.log('== Nordcraft Test Data Compression Benchmark ==')
  console.log(
    `Configuration: fixtures=${fixtureIds.join(',')}, noise=±${config.noiseThresholdPercent}%, max-regression=${config.maxRegressionPercent}%`,
  )

  let baseWorktree: string | undefined
  let worktreeCreated = false
  try {
    if (!config.skipBuild) {
      console.log('\n== Building current checkout ==')
      runCommand(['bun', 'run', 'build'], { cwd: repositoryRoot })
    }

    if (config.baseRef) {
      baseWorktree = baseWorktreePath
      console.log(`\n== Preparing base worktree (${config.baseRef}) ==`)
      removeBenchmarkWorktree(baseWorktreePath)
      worktreeCreated = true
      runCommand(['git', 'worktree', 'add', baseWorktreePath, config.baseRef])
      copyAssetsToWorktree(baseWorktreePath, COMPRESSION_BENCHMARK_ASSETS)

      if (!config.skipBuild) {
        console.log('\n== Installing and building base worktree ==')
        runCommand(['bun', 'install', '--frozen-lockfile'], {
          cwd: baseWorktreePath,
        })
        runCommand(['bun', 'run', 'build'], { cwd: baseWorktreePath })
      }
    }

    console.log('\n== Measuring head ==')
    const headResults = measureCheckout(repositoryRoot, fixtureIds)
    const baseResults = baseWorktree
      ? measureCheckout(baseWorktree, fixtureIds)
      : undefined

    const results = summarizeCompressionBenchmark({
      baseResults,
      headResults,
      noiseThresholdPercent: config.noiseThresholdPercent,
      maxRegressionPercent: config.maxRegressionPercent,
    })

    const markdownPath = config.exportMarkdown
      ? resolve(repositoryRoot, config.exportMarkdown)
      : join(outputRoot, 'compression-benchmark-report.md')
    const jsonPath = config.exportJson
      ? resolve(repositoryRoot, config.exportJson)
      : join(outputRoot, 'compression-benchmark-report.json')
    await writeReport({ config, results, markdownPath, jsonPath })

    if (config.outputDir) {
      await Bun.write(
        join(outputRoot, 'head.json'),
        `${JSON.stringify({ results: headResults }, null, 2)}\n`,
      )
      if (baseResults) {
        await Bun.write(
          join(outputRoot, 'base.json'),
          `${JSON.stringify({ results: baseResults }, null, 2)}\n`,
        )
      }
    }

    console.log(`\nBenchmark output directory: ${outputRoot}`)
    console.log(
      !config.baseRef
        ? 'Head-only baseline collected (no base ref provided).'
        : isCompressionClean(results)
          ? 'Test data compression is 1:1 with the base branch.'
          : 'See the report above for per-fixture compression changes.',
    )
  } finally {
    if (baseWorktree && worktreeCreated) {
      if (config.keepWorktree && existsSync(baseWorktree)) {
        console.log(`Base worktree kept at: ${baseWorktree}`)
      } else {
        removeBenchmarkWorktree(baseWorktree)
      }
    }
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('Compression benchmark execution failed:', error)
    process.exit(1)
  })
}
