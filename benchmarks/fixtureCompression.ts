import { gzipSync } from 'node:zlib'

import type { Component } from '../packages/core/dist/component/component.types'
import { removeTestData } from '../packages/ssr/dist/rendering/testData'
import type { ProjectFiles } from '../packages/ssr/dist/ssr.types'

/**
 * Project fixtures can be benchmarked as they are stored, or after running the
 * same test-data sanitation that projects go through before they are shipped
 * for rendering.
 */
export type FixtureMode = 'raw' | 'compressed'

export const FIXTURE_MODES = ['raw', 'compressed'] as const

export const isFixtureMode = (
  value: string | undefined,
): value is FixtureMode =>
  value !== undefined && (FIXTURE_MODES as readonly string[]).includes(value)

export const parseFixtureMode = (
  args: ReadonlyMap<string, string>,
  name = '--fixtures',
  defaultValue: FixtureMode = 'raw',
): FixtureMode => {
  const value = args.get(name) ?? defaultValue
  if (!isFixtureMode(value)) {
    throw new Error(`${name} must be one of: ${FIXTURE_MODES.join(', ')}`)
  }
  return value
}

const compressComponents = (
  components: Partial<Record<string, Component>>,
): Partial<Record<string, Component>> =>
  Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      component ? removeTestData(component) : component,
    ]),
  )

/**
 * Applies the SSR test-data sanitation to every project and package component.
 * The original project files are left untouched so raw and compressed variants
 * can be benchmarked side by side.
 */
export const compressProjectFiles = (files: ProjectFiles): ProjectFiles => {
  const packages = files.packages
    ? Object.fromEntries(
        Object.entries(files.packages).map(([name, pkg]) => [
          name,
          pkg
            ? {
                ...pkg,
                components: compressComponents(pkg.components ?? {}),
              }
            : pkg,
        ]),
      )
    : undefined

  return {
    ...files,
    components: compressComponents(files.components ?? {}),
    ...(packages ? { packages } : {}),
  }
}

/**
 * Compresses the project files inside a fixture export while preserving the
 * rest of the fixture metadata (project, commit, name, etc.).
 */
export const compressBenchmarkProject = <T extends { files: ProjectFiles }>(
  project: T,
): T => ({
  ...project,
  files: compressProjectFiles(project.files),
})

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8')

const gzipByteLength = (value: string) =>
  gzipSync(Buffer.from(value, 'utf8'), { level: 9 }).byteLength

const reductionPercent = (originalBytes: number, compressedBytes: number) =>
  originalBytes === 0
    ? Number.NaN
    : ((originalBytes - compressedBytes) / originalBytes) * 100

export type ProjectSerializationMetrics = {
  originalBytes: number
  compressedBytes: number
  savedBytes: number
  reductionPercent: number
  originalGzipBytes: number
  compressedGzipBytes: number
  gzipSavedBytes: number
  gzipReductionPercent: number
}

/**
 * Measures the serialized size of a project with and without editor-only test
 * data. This is the payload that has to be transferred, parsed, and retained
 * in memory before a project can be rendered.
 */
export const measureProjectSerialization = (
  files: ProjectFiles,
): ProjectSerializationMetrics => {
  const originalJson = JSON.stringify(files)
  const compressedJson = JSON.stringify(compressProjectFiles(files))
  const originalBytes = byteLength(originalJson)
  const compressedBytes = byteLength(compressedJson)
  const originalGzipBytes = gzipByteLength(originalJson)
  const compressedGzipBytes = gzipByteLength(compressedJson)

  return {
    originalBytes,
    compressedBytes,
    savedBytes: originalBytes - compressedBytes,
    reductionPercent: reductionPercent(originalBytes, compressedBytes),
    originalGzipBytes,
    compressedGzipBytes,
    gzipSavedBytes: originalGzipBytes - compressedGzipBytes,
    gzipReductionPercent: reductionPercent(
      originalGzipBytes,
      compressedGzipBytes,
    ),
  }
}

export const FIXTURE_SERIALIZATION_CASES = [
  { id: 'benchmark-project', file: 'benchmark-project.json' },
  { id: 'nordcraft-com', file: 'nordcraft.com.json' },
] as const

export type FixtureSerializationResult = ProjectSerializationMetrics & {
  id: string
}

export const loadFixtureSerializationResults = async (): Promise<
  FixtureSerializationResult[]
> =>
  Promise.all(
    FIXTURE_SERIALIZATION_CASES.map(async ({ id, file }) => {
      const fixtureUrl = new URL(`./browser/fixtures/${file}`, import.meta.url)
      const project = (await Bun.file(fixtureUrl).json()) as {
        files: ProjectFiles
      }
      return { id, ...measureProjectSerialization(project.files) }
    }),
  )

export const formatBytes = (bytes: number) => {
  const absoluteBytes = Math.abs(bytes)
  if (absoluteBytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  if (absoluteBytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

export const renderFixtureSerializationTable = (
  results: readonly FixtureSerializationResult[],
) => [
  '| Fixture | Raw JSON | Compressed JSON | Saved | Raw gzip | Compressed gzip | Gzip saved |',
  '| :--- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...results.map(
    (result) =>
      `| **${result.id}** | ${formatBytes(result.originalBytes)} | ${formatBytes(result.compressedBytes)} | ${formatBytes(result.savedBytes)} (${result.reductionPercent.toFixed(1)}%) | ${formatBytes(result.originalGzipBytes)} | ${formatBytes(result.compressedGzipBytes)} | ${formatBytes(result.gzipSavedBytes)} (${result.gzipReductionPercent.toFixed(1)}%) |`,
  ),
]
