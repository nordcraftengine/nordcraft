import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownContextProviderFormulaRule } from './unknownContextProviderFormulaRule'

describe('unknownContextFormulaProviderRule', () => {
  test('should detect invalid context provider formula references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            known: {
              name: 'known',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                test: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'known', 'test'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextProviderFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown context provider formula')
    expect(problems[0].details).toEqual({
      providerName: 'known',
      formulaName: 'test',
    })
  })
  test('should detect non-exposed context provider formula references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            known: {
              name: 'known',
              nodes: {},
              formulas: {
                test: {
                  name: 'test',
                  exposeInContext: false,
                  formula: valueFormula(true),
                  arguments: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                test: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'known', 'test'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextProviderFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown context provider formula')
    expect(problems[0].details).toEqual({
      providerName: 'known',
      formulaName: 'test',
    })
  })
  test('should not detect exposed context provider formula references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            known: {
              name: 'known',
              nodes: {},
              formulas: {
                test: {
                  name: 'test',
                  exposeInContext: true,
                  formula: valueFormula(true),
                  arguments: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                test: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'known', 'test'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextProviderFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
