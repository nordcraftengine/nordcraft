import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noContextFormulaArgumentsRule } from './noContextFormulaArgumentsRule'

describe('noContextFormulaArgumentsRule', () => {
  test('should detect exposed formula with declared arguments and report fix', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                testFormula: {
                  name: 'testFormula',
                  arguments: [{ name: 'arg1', testValue: 'foo' }],
                  formula: valueFormula(1),
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noContextFormulaArgumentsRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no context formula arguments')
    expect(problems[0].path).toEqual([
      'components',
      'provider',
      'formulas',
      'testFormula',
    ])
    expect(problems[0].details).toEqual({
      formulaName: 'testFormula',
    })
    expect(problems[0].fixes).toEqual(['remove-context-formula-arguments'])
  })

  test('should detect exposed formula using formulaKey when name is not provided', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                formulaKey123: {
                  arguments: [{ name: 'input', testValue: 42 }],
                  formula: valueFormula('hello'),
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noContextFormulaArgumentsRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no context formula arguments')
    expect(problems[0].path).toEqual([
      'components',
      'provider',
      'formulas',
      'formulaKey123',
    ])
    expect(problems[0].details).toEqual({
      formulaName: 'formulaKey123',
    })
  })

  test('should not detect exposed formula without arguments', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                testFormula: {
                  name: 'testFormula',
                  arguments: [],
                  formula: valueFormula(1),
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
                testFormula2: {
                  name: 'testFormula2',
                  formula: valueFormula(2),
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noContextFormulaArgumentsRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not detect non-exposed formula with arguments', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                internalFormula: {
                  name: 'internalFormula',
                  arguments: [{ name: 'arg1', testValue: 'foo' }],
                  formula: valueFormula(1),
                  exposeInContext: false,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
                internalFormula2: {
                  name: 'internalFormula2',
                  arguments: [{ name: 'arg1', testValue: 'bar' }],
                  formula: valueFormula(2),
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noContextFormulaArgumentsRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should apply remove-context-formula-arguments fix via fixProject', () => {
    const files = {
      components: {
        provider: {
          name: 'provider',
          nodes: {},
          formulas: {
            testFormula: {
              name: 'testFormula',
              arguments: [
                { name: 'arg1', testValue: 'foo' },
                { name: 'arg2', testValue: 123 },
              ],
              formula: valueFormula(1),
              exposeInContext: true,
              '@nordcraft/metadata': {
                comments: null,
              },
            },
          },
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }

    const fixedFiles = fixProject({
      files,
      rule: noContextFormulaArgumentsRule,
      fixType: 'remove-context-formula-arguments',
    })

    expect(
      fixedFiles.components.provider?.formulas?.testFormula?.arguments,
    ).toEqual(null)

    const remainingProblems = Array.from(
      searchProject({
        files: fixedFiles,
        rules: [noContextFormulaArgumentsRule],
      }),
    )

    expect(remainingProblems).toBeEmpty()
  })
})
