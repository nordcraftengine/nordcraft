import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { applyFixResult } from './applyFix'

describe('applyFixResult', () => {
  const baseFiles: ProjectFiles = {
    components: {
      MyComp: {
        name: 'MyComp',
        nodes: {},
        formulas: {
          f1: {
            name: 'formulaOne',
            formula: { type: 'value', value: 1 },
            arguments: [],
          },
        },
      },
    },
  }

  test('returns original files if result is void or null/undefined', () => {
    expect(applyFixResult(baseFiles, undefined)).toBe(baseFiles)
  })

  test('applies single set update via structural sharing', () => {
    const result = applyFixResult(baseFiles, {
      path: ['components', 'MyComp', 'name'],
      value: 'UpdatedComp',
    })

    expect(result.components.MyComp?.name).toBe('UpdatedComp')
    expect(baseFiles.components.MyComp?.name).toBe('MyComp') // Original remains untouched
  })

  test('applies single delete update via structural sharing', () => {
    const result = applyFixResult(baseFiles, {
      path: ['components', 'MyComp', 'formulas', 'f1'],
      delete: true,
    })

    expect(result.components.MyComp?.formulas?.f1).toBeUndefined()
    expect(baseFiles.components.MyComp?.formulas?.f1).toBeDefined()
  })

  test('applies an array of updates sequentially', () => {
    const result = applyFixResult(baseFiles, [
      {
        path: ['components', 'MyComp', 'formulas', 'f2'],
        value: {
          formula: { type: 'value', value: 2 },
          arguments: [],
        },
      },
      {
        path: ['components', 'MyComp', 'formulas', 'f1'],
        delete: true,
      },
    ])

    expect(result.components.MyComp?.formulas?.f1).toBeUndefined()
    expect(result.components.MyComp?.formulas?.f2).toBeDefined()
    expect(result.components.MyComp?.formulas?.f2?.formula).toEqual({
      type: 'value',
      value: 2,
    })
  })
})
