import type { ProjectFiles } from '@nordcraft/ssr'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { unknownTestScenarioContextRule } from './unknownTestScenarioContextRule'

describe('unknownTestScenarioContextRule', () => {
  test('should detect when component does not subscribe to the context provider', () => {
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
              meta: {
                testScenarios: {
                  someScenario: {},
                },
              },
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {},
              meta: {
                testScenarios: {
                  default: {
                    contexts: {
                      provider: 'someScenario',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'provider',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown context provider in test scenario',
          description:
            'Context provider **provider** is not subscribed by "consumer".',
        },
        details: {
          providerName: 'provider',
          scenarioName: 'someScenario',
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
    ])
  })

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
              contexts: {
                missingComponent: {
                  componentName: 'missingComponent',
                  formulas: [],
                  workflows: [],
                },
              },
              meta: {
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
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'missingComponent',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown context component in test scenario',
          description: 'Component **missingComponent** does not exist.',
        },
        details: {
          providerName: 'missingComponent',
          scenarioName: 'someScenario',
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
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
              meta: {
                testScenarios: {
                  existingScenario: {},
                },
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
              meta: {
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
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'provider',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown test scenario in context provider',
          description:
            'Scenario **nonExistentScenario** does not exist in "provider".',
        },
        details: {
          providerName: 'provider',
          scenarioName: 'nonExistentScenario',
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
    ])
  })

  test('should detect when referenced scenario is an empty string on provider component', () => {
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
              meta: {
                testScenarios: {
                  existingScenario: {},
                },
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
              meta: {
                testScenarios: {
                  default: {
                    contexts: {
                      provider: '',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'provider',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown test scenario in context provider',
          description: 'Scenario **** does not exist in "provider".',
        },
        details: {
          providerName: 'provider',
          scenarioName: '',
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
    ])
  })

  test('should handle package context provider scenario validation', () => {
    const files: Omit<ProjectFiles, 'config'> = {
      packages: {
        myPkg: {
          manifest: { name: 'myPkg', commit: '1' },
          components: {
            pkgProvider: {
              name: 'pkgProvider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              meta: {
                testScenarios: {
                  pkgScenario: {},
                },
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
          meta: {
            testScenarios: {
              default: {
                contexts: {
                  'myPkg/pkgProvider': 'missingPkgScenario',
                },
              },
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'myPkg/pkgProvider',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown test scenario in context provider',
          description:
            'Scenario **missingPkgScenario** does not exist in "myPkg/pkgProvider".',
        },
        details: {
          providerName: 'myPkg/pkgProvider',
          scenarioName: 'missingPkgScenario',
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
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
              meta: {
                testScenarios: {
                  existingScenario: {},
                },
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
              meta: {
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
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not report when scenario name is null (opt-out from default scenario) on a subscribed provider', () => {
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
              meta: {
                testScenarios: {
                  defaultScenario: { isDefault: true },
                },
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
              meta: {
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
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should detect when scenario name is null on an unsubscribed provider', () => {
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
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {},
              meta: {
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
        },
        rules: [unknownTestScenarioContextRule],
      }),
    )

    expect(problems).toEqual([
      {
        path: [
          'components',
          'consumer',
          'meta',
          'testScenarios',
          'default',
          'contexts',
          'provider',
        ],
        code: 'unknown test scenario context',
        category: 'Unknown Reference',
        level: 'error',
        info: {
          title: 'Unknown context provider in test scenario',
          description:
            'Context provider **provider** is not subscribed by "consumer".',
        },
        details: {
          providerName: 'provider',
          scenarioName: null,
        },
        fixes: ['delete-test-scenario-reference'],
      } satisfies IssueResult,
    ])
  })

  test('should fix unknown test scenario context by deleting the reference', () => {
    const files: Omit<ProjectFiles, 'config'> = {
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          contexts: {},
          meta: {
            testScenarios: {
              default: {
                contexts: {
                  unsubscribedProvider: 'someScenario',
                },
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
      updatedFiles.components?.consumer?.meta?.testScenarios?.default?.contexts,
    ).toEqual({})
  })
})
