import { searchProject } from '../../searchProject'
import { unknownComponentFormulaInputRule } from './unknownComponentFormulaInputRule'

import { describe, expect, test } from 'bun:test'
describe('unknownComponentFormulaInput', () => {
  test('should detect invalid component formula input references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
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
                  arguments: [{ name: 'Input', testValue: 'Input' }],
                  memoize: false,
                  exposeInContext: false,
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown component formula input')
    expect(problems[0].details).toEqual({ name: 'Unknown' })
    expect(problems[1].code).toBe('unknown component formula input')
    expect(problems[1].details).toEqual({ name: null })
  })
  test('should not detect valid component formula input references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
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
                  arguments: [{ name: 'Input', testValue: 'Input' }],
                  memoize: false,
                  exposeInContext: false,
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
  test('should not detect @toddle.parent/item path formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
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
                        name: '1',
                        formula: {
                          type: 'path',
                          path: ['Args', '@toddle.parent', 'test'],
                        },
                      },
                    ],
                    variableArguments: true,
                    display_name: 'Concatenate',
                  },
                  arguments: [{ name: 'Input', testValue: 'Input' }],
                  memoize: false,
                  exposeInContext: false,
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentFormulaInputRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
