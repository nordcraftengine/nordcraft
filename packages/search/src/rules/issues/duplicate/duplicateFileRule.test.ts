import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { duplicateFileRule } from './duplicateFileRule'

describe('duplicateFileRule', () => {
  test('should flag duplicate components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            a: { name: 'a', nodes: {} } as any,
            b: { name: 'b', nodes: {} } as any,
          },
        },
        rules: [duplicateFileRule],
      }),
    )
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('duplicate-file')
    expect(problems[0].details.duplicates).toHaveLength(1)
  })

  test('should not flag different components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            a: { name: 'a', nodes: {} } as any,
            b: {
              name: 'b',
              nodes: {
                root: { type: 'element', tag: 'div' },
              },
            } as any,
          },
        },
        rules: [duplicateFileRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should flag duplicate global formulas', () => {
    const formula = {
      name: 'myFormula',
      arguments: [],
      formula: { type: 'value', value: 42 },
    }
    const problems = Array.from(
      searchProject({
        files: {
          components: {},
          formulas: {
            f1: structuredClone(formula) as any,
            f2: { ...structuredClone(formula), name: 'f2' } as any,
          },
        },
        rules: [duplicateFileRule],
      }),
    )
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('duplicate-file')
  })

  test('should flag duplicates with different key order', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            a: {
              name: 'a',
              nodes: {
                root: { type: 'element', tag: 'div', attrs: { x: 1, y: 2 } },
              },
            } as any,
            // Same content, different key insertion order
            b: {
              nodes: {
                root: { attrs: { y: 2, x: 1 }, tag: 'div', type: 'element' },
              },
              name: 'b',
            } as any,
          },
        },
        rules: [duplicateFileRule],
      }),
    )
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('duplicate-file')
  })

  test('should ignore metadata/comments when comparing', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            a: {
              name: 'a',
              nodes: {},
              '@nordcraft/metadata': {
                comments: { x: { text: 'hi', index: 0 } },
              },
            } as any,
            b: { name: 'b', nodes: {} } as any,
          },
        },
        rules: [duplicateFileRule],
      }),
    )
    expect(problems).toHaveLength(2)
  })
})
