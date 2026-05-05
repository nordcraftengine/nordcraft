import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noReferenceContextWorkflowRule } from './noReferenceContextWorkflowRule'

describe('noReferenceContextWorkflowRule', () => {
  test('should detect context workflows that are not used', () => {
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
                  formulas: [],
                  workflows: ['unusedWorkflow', 'usedWorkflow'],
                  componentName: 'provider1',
                },
              },
            },
          },
        },
        rules: [noReferenceContextWorkflowRule],
      }),
    )

    expect(
      problems.filter((p: any) => p.code === 'no-reference context workflow'),
    ).toHaveLength(2)
  })

  test('should not detect used context workflows', () => {
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
              workflows: {
                trigger: {
                  name: 'trigger',
                  parameters: [],
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      contextProvider: 'provider1',
                      workflow: 'usedWorkflow',
                      parameters: {},
                    },
                  ],
                },
              },
              contexts: {
                provider1: {
                  formulas: [],
                  workflows: ['usedWorkflow'],
                  componentName: 'provider1',
                },
              },
            },
          },
        },
        rules: [noReferenceContextWorkflowRule],
      }),
    )

    expect(
      problems.filter((p: any) => p.code === 'no-reference context workflow'),
    ).toHaveLength(0)
  })

  test('should apply remove-context-workflow-subscription fix', () => {
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
              formulas: ['someFormula'],
              workflows: ['unusedWorkflow', 'usedWorkflow'],
              componentName: 'provider1',
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [noReferenceContextWorkflowRule],
      }),
    )

    const unusedProblem = problems.find(
      (p) => p.details?.workflowName === 'unusedWorkflow',
    )
    expect(unusedProblem).toBeDefined()

    const fix =
      noReferenceContextWorkflowRule.fixes?.[
        'remove-context-workflow-subscription'
      ]
    const result = fix?.({
      data: {
        files: files as any,
        path: ['components', 'consumer'],
      } as any,
      details: unusedProblem?.details as any,
    })

    expect(result?.components.consumer?.contexts?.provider1.workflows).toEqual([
      'usedWorkflow',
    ])
    expect(result?.components.consumer?.contexts?.provider1.formulas).toEqual([
      'someFormula',
    ])
  })

  test('should remove entire context if no formulas/workflows remain', () => {
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
              formulas: [],
              workflows: ['unusedWorkflow'],
              componentName: 'provider1',
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [noReferenceContextWorkflowRule],
      }),
    )

    const fix =
      noReferenceContextWorkflowRule.fixes?.[
        'remove-context-workflow-subscription'
      ]
    const result = fix?.({
      data: {
        files: files as any,
        path: ['components', 'consumer'],
      } as any,
      details: problems[0]?.details as any,
    })

    expect(result?.components.consumer?.contexts?.provider1).toBeUndefined()
  })

  test('should detect and fix unused context workflows from a package component', () => {
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
            'pkg/provider': {
              formulas: [],
              workflows: ['unusedWorkflow'],
              componentName: 'provider',
              package: 'pkg',
            },
          },
        },
      },
      packages: {
        pkg: {
          components: {
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                unusedWorkflow: {
                  name: 'unusedWorkflow',
                  parameters: [],
                  actions: [],
                },
              },
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files: files as any,
        rules: [noReferenceContextWorkflowRule],
      }),
    )

    const unusedProblem = problems.find(
      (p) =>
        p.code === 'no-reference context workflow' &&
        p.details?.workflowName === 'unusedWorkflow' &&
        p.details?.providerName === 'pkg/provider',
    )
    expect(unusedProblem).toBeDefined()

    const fix =
      noReferenceContextWorkflowRule.fixes?.[
        'remove-context-workflow-subscription'
      ]
    const result = fix?.({
      data: {
        files: files as any,
        path: ['components', 'consumer'],
      } as any,
      details: unusedProblem?.details as any,
    })

    expect(
      result?.components.consumer?.contexts?.['pkg/provider'],
    ).toBeUndefined()
  })
})
