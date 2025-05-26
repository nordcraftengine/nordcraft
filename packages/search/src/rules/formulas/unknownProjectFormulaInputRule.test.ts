import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { unknownProjectFormulaInputRule } from './unknownProjectFormulaInputRule'

describe('unknownProjectFormulaInput', () => {
  test('should detect invalid project formula input references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            myFormula: {
              name: 'Test',
              formula: {
                type: 'function',
                name: '@toddle/concatenate',
                arguments: [
                  {
                    name: '0',
                    formula: { type: 'path', path: ['Args', 'Unknown'] },
                  },
                  {
                    name: '1',
                    formula: { type: 'path', path: ['Args', null as any] },
                  },
                ],
                variableArguments: true,
                display_name: 'Concatenate',
              },
              arguments: [{ name: 'Input', formula: valueFormula(null) }],
            },
          },
          components: {},
        },
        rules: [unknownProjectFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown project formula input')
    expect(problems[0].details).toEqual({ name: 'Unknown' })
    expect(problems[1].code).toBe('unknown project formula input')
    expect(problems[1].details).toEqual({ name: null })
  })
  test('should not detect valid project formula input references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            myFormula: {
              name: 'Test',
              formula: {
                type: 'function',
                name: '@toddle/concatenate',
                arguments: [
                  {
                    name: '0',
                    formula: { type: 'path', path: ['Args', 'Input'] },
                  },
                ],
                variableArguments: true,
                display_name: 'Concatenate',
              },
              arguments: [{ name: 'Input', formula: valueFormula(null) }],
            },
          },
          components: {},
        },
        rules: [unknownProjectFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
  test('should not detect @toddle.parent/item path formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            myFormula: {
              name: 'Test',
              formula: {
                type: 'function',
                name: '@toddle/concatenate',
                arguments: [
                  {
                    name: '0',
                    formula: { type: 'path', path: ['Args', 'item'] },
                  },
                  {
                    name: '0',
                    formula: {
                      type: 'path',
                      path: ['Args', '@toddle.parent', 'test'],
                    },
                  },
                ],
                variableArguments: true,
                display_name: 'Concatenate',
              },
              arguments: [],
            },
          },
          components: {},
        },
        rules: [unknownProjectFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
