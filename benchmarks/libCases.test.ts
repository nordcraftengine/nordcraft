import { describe, expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  findLibBenchmarkCase,
  isLibBenchmarkCaseId,
  isSkippedLibBenchmarkCase,
  LIB_BENCHMARK_CASES,
  libBenchmarkUsage,
  SKIPPED_LIB_BENCHMARK_CASE_IDS,
} from './libCases'

const listDirNames = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

describe('Lib benchmark cases', () => {
  test('exposes a stable case id per std-lib function', () => {
    expect(LIB_BENCHMARK_CASES.length).toBeGreaterThan(100)
    const ids = LIB_BENCHMARK_CASES.map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(isLibBenchmarkCaseId('formula-sum')).toBe(true)
    expect(isLibBenchmarkCaseId('formula-filter')).toBe(true)
    expect(isLibBenchmarkCaseId('action-sleep')).toBe(true)
    expect(isLibBenchmarkCaseId('not-a-case')).toBe(false)
    expect(isLibBenchmarkCaseId(undefined)).toBe(false)
  })

  test('covers every formula in packages/lib/formulas', () => {
    const formulasDir = join(import.meta.dir, '../packages/lib/formulas')
    const folders = listDirNames(formulasDir)
    const targets = new Set(
      LIB_BENCHMARK_CASES.filter(({ kind }) => kind === 'formula').map(
        ({ target }) => target,
      ),
    )
    const missing = folders.filter((folder) => !targets.has(folder))
    expect(missing).toEqual([])
    const extra = [...targets].filter((target) => !folders.includes(target))
    expect(extra).toEqual([])
  })

  test('covers every action in packages/lib/actions', () => {
    const actionsDir = join(import.meta.dir, '../packages/lib/actions')
    const folders = listDirNames(actionsDir)
    const targets = new Set(
      LIB_BENCHMARK_CASES.filter(({ kind }) => kind === 'action').map(
        ({ target }) => target,
      ),
    )
    const missing = folders.filter((folder) => !targets.has(folder))
    expect(missing).toEqual([])
    const extra = [...targets].filter((target) => !folders.includes(target))
    expect(extra).toEqual([])
  })

  test('uses unique targets and well-formed ids', () => {
    for (const benchmarkCase of LIB_BENCHMARK_CASES) {
      const kebabTarget = benchmarkCase.target
        .replace(/_/g, '-')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
      expect(benchmarkCase.id).toBe(`${benchmarkCase.kind}-${kebabTarget}`)
    }
    const targets = LIB_BENCHMARK_CASES.map(
      ({ kind, target }) => `${kind}:${target}`,
    )
    expect(new Set(targets).size).toBe(targets.length)
    expect(findLibBenchmarkCase('formula-sum')?.target).toBe('sum')
    expect(findLibBenchmarkCase('action-sleep')?.target).toBe('sleep')
  })

  test('builds usage text from the shared case list', () => {
    const usage = libBenchmarkUsage()
    expect(usage.startsWith('--case=<')).toBe(true)
    expect(usage).toContain('formula-sum')
    expect(usage).toContain('formula-filter')
    expect(usage).toContain('action-sleep')
    expect(usage).toContain('formula-minus')
    expect(usage.endsWith('>')).toBe(true)
  })

  test('marks thin-passthrough cases as skipped without dropping coverage', () => {
    expect(SKIPPED_LIB_BENCHMARK_CASE_IDS.length).toBeGreaterThan(0)
    for (const id of SKIPPED_LIB_BENCHMARK_CASE_IDS) {
      const benchmarkCase = findLibBenchmarkCase(id)
      expect(benchmarkCase).toBeDefined()
      expect(isSkippedLibBenchmarkCase(benchmarkCase!)).toBe(true)
    }
    // Skipped cases stay defined so they can be re-enabled case-by-case.
    expect(
      isSkippedLibBenchmarkCase(findLibBenchmarkCase('formula-minus')!),
    ).toBe(true)
    expect(
      isSkippedLibBenchmarkCase(findLibBenchmarkCase('action-sleep')!),
    ).toBe(true)
    expect(
      isSkippedLibBenchmarkCase(findLibBenchmarkCase('formula-filter')!),
    ).toBe(false)
    expect(
      isSkippedLibBenchmarkCase(findLibBenchmarkCase('action-set-cookie')!),
    ).toBe(false)
  })
})
