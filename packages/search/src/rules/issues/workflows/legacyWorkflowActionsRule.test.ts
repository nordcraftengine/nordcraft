import type { ProjectFiles } from '@nordcraft/ssr'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { legacyWorkflowActionsRule } from './legacyWorkflowActionsRule'

describe('legacyWorkflowActionsRule', () => {
  const originalMathRandom = Math.random

  beforeEach(() => {
    let counter = 0
    Math.random = () => (counter++ % 64) / 64
  })

  afterEach(() => {
    Math.random = originalMathRandom
  })

  test('reports workflows where actions is an array and ignores object actions', () => {
    const files: ProjectFiles = {
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {},
          workflows: {
            legacyWf: {
              name: 'My Legacy Workflow',
              parameters: [],
              actions: [
                {
                  type: 'SetVariable',
                  variable: 'count',
                  data: {
                    type: 'value',
                    value: 1,
                  },
                },
              ],
            },
            modernWf: {
              parameters: [],
              actions: {
                act1: {
                  index: 0,
                  type: 'SetVariable',
                  variable: 'count',
                  data: {
                    type: 'value',
                    value: 2,
                  },
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
        rules: [legacyWorkflowActionsRule],
      }),
    )

    expect(problems).toEqual([
      {
        code: 'legacy workflow actions',
        category: 'Deprecation',
        level: 'info',
        path: ['components', 'MyComponent', 'workflows', 'legacyWf'],
        details: {
          name: 'My Legacy Workflow',
        },
        fixes: ['replace-legacy-workflow-actions'],
        info: {
          title: 'Workflow actions defined as an array',
          description:
            'Actions in the **My Legacy Workflow** workflow are defined as an array. Consider converting them to an object to make workflow changes easier to compare and visualize.',
        },
      },
    ] satisfies IssueResult[])
  })

  test('autofix converts workflow actions array into an indexed object using nanoid(6)', () => {
    const files: ProjectFiles = {
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {},
          workflows: {
            myWorkflow: {
              parameters: [],
              actions: [
                {
                  type: 'SetVariable',
                  variable: 'step',
                  data: {
                    type: 'value',
                    value: 'first',
                  },
                },
                {
                  type: 'TriggerEvent',
                  event: 'completed',
                  data: {
                    type: 'value',
                    value: 'second',
                  },
                },
              ],
            },
          },
        },
      },
    }

    const fixedFiles = fixProject({
      files,
      rule: legacyWorkflowActionsRule,
      fixType: 'replace-legacy-workflow-actions',
    })

    expect(fixedFiles).toEqual({
      components: {
        MyComponent: {
          name: 'MyComponent',
          nodes: {},
          workflows: {
            myWorkflow: {
              parameters: [],
              actions: {
                useand: {
                  index: 0,
                  type: 'SetVariable',
                  variable: 'step',
                  data: {
                    type: 'value',
                    value: 'first',
                  },
                },
                'om-26T': {
                  index: 1,
                  type: 'TriggerEvent',
                  event: 'completed',
                  data: {
                    type: 'value',
                    value: 'second',
                  },
                },
              },
            },
          },
        },
      },
    } satisfies ProjectFiles)
  })
})
