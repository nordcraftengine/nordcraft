import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { duplicateFormulaArgumentNameRule } from './duplicateFormulaArgumentNameRule'

describe('duplicateFormulaArgumentNameRule', () => {
  test('should detect duplicate argument names in formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  arguments: [
                    { name: 'arg1', testValue: 'bla' },
                    { name: 'arg2', testValue: 'bla' },
                    { name: 'arg1', testValue: 'bla' }, // Duplicate
                  ],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateFormulaArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate formula argument name')
    expect(problems[0].details).toEqual({ name: 'arg1' })
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'formulas',
      'myFormula',
    ])
  })
  test('should detect duplicate argument names in project formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            myFormula: {
              name: 'myFormula',
              arguments: [
                { name: 'arg1', testValue: 'bla' },
                { name: 'arg2', testValue: 'bla' },
                { name: 'arg1', testValue: 'bla' }, // Duplicate
              ],
              formula: {
                type: 'value',
                value: null,
              },
            },
          },
          components: {},
        },
        rules: [duplicateFormulaArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate formula argument name')
    expect(problems[0].details).toEqual({ name: 'arg1' })
    expect(problems[0].path).toEqual(['formulas', 'myFormula'])
  })
  test('should not report when there are no duplicate argument names', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  arguments: [
                    { name: 'arg1', testValue: 'bla' },
                    { name: 'arg2', testValue: 'bla' },
                    { name: 'arg3', testValue: 'bla' },
                  ],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateFormulaArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should detect multiple duplicates', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  arguments: [
                    { name: 'arg1', testValue: 'bla' },
                    { name: 'arg2', testValue: 'bla' },
                    { name: 'arg1', testValue: 'bla' }, // Duplicate
                    { name: 'arg2', testValue: 'bla' }, // Duplicate
                  ],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateFormulaArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].details).toEqual({ name: 'arg1' })
    expect(problems[1].details).toEqual({ name: 'arg2' })
  })

  test('should not report for formulas with no arguments', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateFormulaArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
