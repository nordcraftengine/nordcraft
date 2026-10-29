import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { unknownTestScenarioContextRule } from './unknownTestScenarioContextRule'

describe('unknownTestScenarioContextRule', () => {
  test('should detect when context component does not exist', () => {
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
              testScenarios: {
                default: {
                  contexts: {
                    missingComponent: 'someScenario',
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario context')
    expect(problems[0].path).toEqual([
      'components',
      'consumer',
      'testScenarios',
      'default',
      'contexts',
      'missingComponent',
    ])
  })

  test('should detect when referenced scenario does not exist on provider component', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                existingScenario: {},
              },
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                provider: {
                  componentName: 'provider',
                  formulas: [],
                  workflows: [],
                },
              },
              testScenarios: {
                default: {
                  contexts: {
                    provider: 'nonExistentScenario',
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario context')
    expect(problems[0].path).toEqual([
      'components',
      'consumer',
      'testScenarios',
      'default',
      'contexts',
      'provider',
    ])
  })

  test('should handle package context provider scenario validation', () => {
    const files = {
      packages: {
        myPkg: {
          name: 'myPkg',
          components: {
            pkgProvider: {
              name: 'pkgProvider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                pkgScenario: {},
              },
            },
          },
        },
      },
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          contexts: {
            'myPkg/pkgProvider': {
              componentName: 'pkgProvider',
              package: 'myPkg',
              formulas: [],
              workflows: [],
            },
          },
          testScenarios: {
            default: {
              contexts: {
                'myPkg/pkgProvider': 'missingPkgScenario',
              },
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files: files as any,
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario context')
    expect(problems[0].path).toEqual([
      'components',
      'consumer',
      'testScenarios',
      'default',
      'contexts',
      'myPkg/pkgProvider',
    ])
  })

  test('should not report when context provider and scenario exist', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                existingScenario: {},
              },
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                provider: {
                  componentName: 'provider',
                  formulas: [],
                  workflows: [],
                },
              },
              testScenarios: {
                default: {
                  contexts: {
                    provider: 'existingScenario',
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should detect when scenario name is null or invalid', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {},
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              testScenarios: {
                default: {
                  contexts: {
                    provider: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario context')
    expect(problems[0].path).toEqual([
      'components',
      'consumer',
      'testScenarios',
      'default',
      'contexts',
      'provider',
    ])
  })

  test('should fix unknown test scenario context by deleting the reference', () => {
    const files = {
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          contexts: {},
          testScenarios: {
            default: {
              contexts: {
                unsubscribedProvider: 'someScenario',
              },
            },
          },
        },
      },
    }

    const updatedFiles = fixProject({
      files,
      rule: unknownTestScenarioContextRule,
      fixType: 'delete-test-scenario-reference',
    })

    expect(
      updatedFiles.components?.consumer?.testScenarios?.default?.contexts,
    ).toEqual({})
  })
})
