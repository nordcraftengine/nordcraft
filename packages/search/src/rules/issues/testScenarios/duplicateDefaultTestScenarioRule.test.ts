import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { duplicateDefaultTestScenarioRule } from './duplicateDefaultTestScenarioRule'

describe('duplicateDefaultTestScenarioRule', () => {
  test('should detect multiple default test scenarios on a component', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                first: {
                  isDefault: true,
                },
                second: {
                  isDefault: true,
                },
              },
            },
          },
        },
        rules: [duplicateDefaultTestScenarioRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate default test scenario')
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'testScenarios',
      'second',
      'isDefault',
    ])
  })

  test('should not report when only one scenario is default', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                first: {
                  isDefault: true,
                },
                second: {
                  isDefault: false,
                },
              },
            },
          },
        },
        rules: [duplicateDefaultTestScenarioRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should fix duplicate default by unsetting isDefault on the extra scenario', () => {
    const files = {
      components: {
        myComp: {
          name: 'myComp',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          testScenarios: {
            first: {
              isDefault: true,
            },
            second: {
              isDefault: true,
            },
          },
        },
      },
    }

    const updatedFiles = fixProject({
      files,
      rule: duplicateDefaultTestScenarioRule,
      fixType: 'delete-test-scenario-reference',
    })

    expect(
      updatedFiles.components?.myComp?.testScenarios?.first?.isDefault,
    ).toBe(true)
    expect(
      updatedFiles.components?.myComp?.testScenarios?.second?.isDefault,
    ).toBeUndefined()
  })
})
