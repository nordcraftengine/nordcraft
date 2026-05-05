import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noReferenceContextFormulaRule } from './noReferenceContextFormulaRule'

describe('noReferenceContextFormulaRule', () => {
  test('should detect context formulas that are not used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                provider1: {
                  formulas: ['unusedFormula', 'usedFormula'],
                  workflows: [],
                  componentName: 'provider1',
                },
              },
            },
          },
        },
        rules: [noReferenceContextFormulaRule],
      }),
    )

    // Initially none are used, so both should be reported (if we only check formulas)
    expect(
      problems.filter((p: any) => p.code === 'no-reference context formula'),
    ).toHaveLength(2)
  })

  test('should not detect used context formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {
                test: {
                  name: 'test',
                  formula: {
                    type: 'path',
                    path: ['Contexts', 'provider1', 'usedFormula'],
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                provider1: {
                  formulas: ['usedFormula'],
                  workflows: [],
                  componentName: 'provider1',
                },
              },
            },
          },
        },
        rules: [noReferenceContextFormulaRule],
      }),
    )

    expect(
      problems.filter((p: any) => p.code === 'no-reference context formula'),
    ).toHaveLength(0)
  })

  test('should apply remove-context-formula-subscription fix', () => {
    const files = {
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          contexts: {
            provider1: {
              formulas: ['unusedFormula', 'usedFormula'],
              workflows: [],
              componentName: 'provider1',
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [noReferenceContextFormulaRule],
      }),
    )

    const unusedProblem = problems.find(
      (p) => p.details?.formulaName === 'unusedFormula',
    )
    expect(unusedProblem).toBeDefined()

    const fix =
      noReferenceContextFormulaRule.fixes?.[
        'remove-context-formula-subscription'
      ]
    const result = fix?.({
      data: {
        files: files as any,
        path: ['components', 'consumer'],
      } as any,
      details: unusedProblem?.details as any,
    })

    expect(result?.components.consumer?.contexts?.provider1.formulas).toEqual([
      'usedFormula',
    ])
  })

  test('should remove entire context if it has no formulas left', () => {
    const files = {
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          contexts: {
            provider1: {
              formulas: ['unusedFormula'],
              workflows: [],
              componentName: 'provider1',
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [noReferenceContextFormulaRule],
      }),
    )

    const unusedProblem = problems.find(
      (p) => p.details?.formulaName === 'unusedFormula',
    )
    expect(unusedProblem).toBeDefined()

    const fix =
      noReferenceContextFormulaRule.fixes?.[
        'remove-context-formula-subscription'
      ]
    const result = fix?.({
      data: {
        files: files as any,
        path: ['components', 'consumer'],
      } as any,
      details: unusedProblem?.details as any,
    })

    expect(result?.components.consumer?.contexts).toEqual({})
  })
})
