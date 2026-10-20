import { gzipSync } from 'node:zlib'

import type { Component } from '../packages/core/dist/component/component.types'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'
import { percentageDelta } from './stats'

export type ComponentStripper =
  | ((component: Component) => Component)
  | ((files: ProjectFiles) => ProjectFiles)

export interface CompressionMetrics {
  componentCount: number
  originalBytes: number
  strippedBytes: number
  savedBytes: number
  reductionPercent: number
  originalGzipBytes: number
  strippedGzipBytes: number
  gzipSavedBytes: number
  gzipReductionPercent: number
}

export type CompressionFixtureResult = CompressionMetrics & {
  id: string
  name: string
}

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8')

const gzipByteLength = (value: string) =>
  gzipSync(Buffer.from(value, 'utf8'), { level: 9 }).byteLength

const compressionPercent = (originalBytes: number, compressedBytes: number) =>
  originalBytes === 0
    ? Number.NaN
    : ((originalBytes - compressedBytes) / originalBytes) * 100

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const stripTestData = (
  components: Record<string, unknown>,
  strip: ComponentStripper,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      isRecord(component)
        ? (strip as (target: unknown) => unknown)(component)
        : component,
    ]),
  )

/**
 * Applies a component stripper (e.g. `removeTestData`) to every project and
 * package component before measuring the serialized project size.
 */
export const measureProjectFiles = (
  files: ProjectFiles,
  strip: ComponentStripper,
): Omit<CompressionMetrics, 'id' | 'name'> => {
  const candidate = (strip as (target: unknown) => unknown)(files)
  const strippedFiles =
    isRecord(candidate) &&
    ('components' in candidate || 'packages' in candidate) &&
    !('nodes' in candidate)
      ? (candidate as unknown as ProjectFiles)
      : {
          ...files,
          components: stripTestData(files.components ?? {}, strip),
          ...(files.packages
            ? {
                packages: Object.fromEntries(
                  Object.entries(files.packages).map(([name, pkg]) => [
                    name,
                    pkg
                      ? {
                          ...pkg,
                          components: stripTestData(
                            pkg.components ?? {},
                            strip,
                          ),
                        }
                      : pkg,
                  ]),
                ),
              }
            : {}),
        }

  const originalJson = JSON.stringify(files)
  const strippedJson = JSON.stringify(strippedFiles)
  const originalBytes = byteLength(originalJson)
  const strippedBytes = byteLength(strippedJson)
  const originalGzipBytes = gzipByteLength(originalJson)
  const strippedGzipBytes = gzipByteLength(strippedJson)

  const componentCount =
    Object.keys(files.components ?? {}).length +
    Object.values(files.packages ?? {}).reduce(
      (count, pkg) => count + Object.keys(pkg?.components ?? {}).length,
      0,
    )

  return {
    componentCount,
    originalBytes,
    strippedBytes,
    savedBytes: originalBytes - strippedBytes,
    reductionPercent: compressionPercent(originalBytes, strippedBytes),
    originalGzipBytes,
    strippedGzipBytes,
    gzipSavedBytes: originalGzipBytes - strippedGzipBytes,
    gzipReductionPercent: compressionPercent(
      originalGzipBytes,
      strippedGzipBytes,
    ),
  }
}

export interface CompressionFixtureSummary extends CompressionFixtureResult {
  mode: 'comparison' | 'head-only'
  deltaStrippedBytes: number
  deltaStrippedPercent: number
  deltaReductionPercent: number
  deltaStrippedGzipBytes: number
  deltaGzipReductionPercent: number
  status: CompressionStatus
  verdict: string
}

export type CompressionStatus = '1:1' | 'improvement' | 'regression' | 'stable'

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} B`

export const formatSignedBytes = (bytes: number) =>
  `${bytes > 0 ? '+' : ''}${formatBytes(bytes)}`

export const formatSignedPercent = (value: number) =>
  Number.isFinite(value)
    ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    : 'n/a'

/**
 * Deterministic size comparisons do not need statistical tests: any change in
 * the stripped project size is a real change. The noise threshold only guards
 * against negligible drift so comments stay 1:1 unless something actually
 * changed.
 */
export const evaluateCompressionVerdict = ({
  isByteIdentical,
  deltaStrippedPercent,
  deltaStrippedBytes,
  noiseThresholdPercent,
  maxRegressionPercent,
}: {
  isByteIdentical: boolean
  deltaStrippedPercent: number
  deltaStrippedBytes: number
  noiseThresholdPercent: number
  maxRegressionPercent: number
}): { status: CompressionStatus; verdict: string } => {
  if (isByteIdentical) {
    return { status: '1:1', verdict: '🟢 1:1 (Identical output)' }
  }
  if (
    !Number.isFinite(deltaStrippedPercent) ||
    Math.abs(deltaStrippedPercent) <= noiseThresholdPercent
  ) {
    return { status: '1:1', verdict: '🟢 1:1' }
  }
  if (deltaStrippedPercent > maxRegressionPercent) {
    return {
      status: 'regression',
      verdict: `⚠️ ${formatSignedBytes(deltaStrippedBytes)} (${formatSignedPercent(deltaStrippedPercent)}) larger`,
    }
  }
  if (deltaStrippedPercent < -maxRegressionPercent) {
    return {
      status: 'improvement',
      verdict: `🚀 ${formatSignedBytes(deltaStrippedBytes)} (${formatSignedPercent(deltaStrippedPercent)}) smaller`,
    }
  }
  return { status: 'stable', verdict: '🟢 Stable' }
}

export const isCompressionClean = (
  results: ReadonlyArray<{ status: CompressionStatus }>,
) =>
  results.length > 0 &&
  results.every(
    (result) => result.status === '1:1' || result.status === 'stable',
  )

/**
 * Pairs the head measurement of every fixture with its base measurement and
 * evaluates whether test data removal got stronger, weaker, or stayed 1:1.
 */
export const summarizeCompressionBenchmark = ({
  baseResults,
  headResults,
  noiseThresholdPercent,
  maxRegressionPercent,
}: {
  baseResults: ReadonlyArray<CompressionFixtureResult> | undefined
  headResults: readonly CompressionFixtureResult[]
  noiseThresholdPercent: number
  maxRegressionPercent: number
}): CompressionFixtureSummary[] =>
  headResults.map((head) => {
    const base = baseResults?.find((result) => result.id === head.id)
    if (!base) {
      return {
        ...head,
        mode: 'head-only' as const,
        deltaStrippedBytes: Number.NaN,
        deltaStrippedPercent: Number.NaN,
        deltaReductionPercent: Number.NaN,
        deltaStrippedGzipBytes: Number.NaN,
        deltaGzipReductionPercent: Number.NaN,
        status: '1:1' as const,
        verdict: '📊 Baseline (head-only)',
      }
    }
    const deltaStrippedBytes = head.strippedBytes - base.strippedBytes
    const deltaStrippedPercent = percentageDelta(
      base.strippedBytes,
      head.strippedBytes,
    )
    const deltaStrippedGzipBytes =
      head.strippedGzipBytes - base.strippedGzipBytes
    const { status, verdict } = evaluateCompressionVerdict({
      isByteIdentical: deltaStrippedBytes === 0 && deltaStrippedGzipBytes === 0,
      deltaStrippedPercent,
      deltaStrippedBytes,
      noiseThresholdPercent,
      maxRegressionPercent,
    })
    return {
      ...head,
      mode: 'comparison' as const,
      deltaStrippedBytes,
      deltaStrippedPercent,
      deltaReductionPercent: head.reductionPercent - base.reductionPercent,
      deltaStrippedGzipBytes,
      deltaGzipReductionPercent:
        head.gzipReductionPercent - base.gzipReductionPercent,
      status,
      verdict,
    }
  })

export interface CompressionRenderConfig {
  baseRef?: string
  noiseThresholdPercent: number
  maxRegressionPercent: number
}

export const renderCompressionMarkdown = ({
  config,
  results,
}: {
  config: CompressionRenderConfig
  results: readonly CompressionFixtureSummary[]
}) => {
  const isHeadOnly = results.every((result) => result.mode === 'head-only')
  const hasRegressions = results.some(
    (result) => result.status === 'regression',
  )
  return [
    '## 🗜️ Nordcraft Test Data Compression Benchmark',
    '',
    `Measures how much smaller projects get after \`removeTestData\` strips editor-only test data before shipping (raw and gzipped JSON).`,
    '',
    `- **Base ref**: ${config.baseRef ?? 'head-only'}`,
    `- **Noise Threshold**: ±${config.noiseThresholdPercent.toFixed(2)}%`,
    `- **Allowed Regression Threshold**: ${config.maxRegressionPercent.toFixed(2)}%`,
    `- **Mode**: ${isHeadOnly ? 'head-only baseline (no independent base)' : 'base/head comparison'}`,
    '',
    hasRegressions
      ? '> ⚠️ **Warning**: Test data removal ships larger projects than the base branch in one or more fixtures.'
      : isHeadOnly
        ? '> ℹ️ No base ref provided — numbers are a head-only baseline.'
        : '> ✅ **No regressions detected**. Test data removal is 1:1, stable, or strips more than the base branch.',
    '',
    '| Fixture | Components | Original | After removal | Saved | Reduction | Gzip after | Gzip reduction | Verdict |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |',
    ...results.map(
      (result) =>
        `| **${result.id}** | ${result.componentCount} | ${formatBytes(result.originalBytes)} | ${formatBytes(result.strippedBytes)} | ${formatBytes(result.savedBytes)} | ${result.reductionPercent.toFixed(2)}% | ${formatBytes(result.strippedGzipBytes)} | ${result.gzipReductionPercent.toFixed(2)}% | ${result.verdict} |`,
    ),
    '',
  ].join('\n')
}
