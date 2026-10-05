import { describe, expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  isLibBenchmarkCaseId,
  LIB_BENCHMARK_CASES,
  libBenchmarkUsage,
} from './libCases'

describe('Lib benchmark cases', () => {
  test('exposes a stable case id per std-lib formula', () => {
    expect(LIB_BENCHMARK_CASES.length).toBeGreaterThan(80)
    const ids = LIB_BENCHMARK_CASES.map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(isLibBenchmarkCaseId('sum')).toBe(true)
    expect(isLibBenchmarkCaseId('filter')).toBe(true)
    expect(isLibBenchmarkCaseId('not-a-case')).toBe(false)
    expect(isLibBenchmarkCaseId(undefined)).toBe(false)
  })

  test('covers every formula in packages/lib/formulas', () => {
    const formulasDir = join(import.meta.dir, '../packages/lib/formulas')
    const folders = readdirSync(formulasDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    const caseIds = new Set(LIB_BENCHMARK_CASES.map(({ id }) => id))
    const missing = folders.filter((folder) => !caseIds.has(folder as never))
    expect(missing).toEqual([])
    const extra = [...caseIds].filter((id) => !folders.includes(id as string))
    expect(extra).toEqual([])
  })

  test('builds usage text from the shared case list', () => {
    const usage = libBenchmarkUsage()
    expect(usage.startsWith('--case=<')).toBe(true)
    expect(usage).toContain('sum')
    expect(usage).toContain('filter')
    expect(usage.endsWith('>')).toBe(true)
  })
})
