import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { duplicateWorkflowParameterRule } from './duplicateWorkflowParameterRule'

describe('duplicateWorkflowParameterRule', () => {
  test('should detect duplicate workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [],
                query: {},
              },
              workflows: {
                myWorkflow: {
                  name: 'myWorkflow',
                  parameters: [
                    {
                      name: 'myParameter',
                      testValue: '1',
                    },
                    {
                      name: 'myParameter',
                      testValue: '1',
                    },
                  ],
                  actions: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [duplicateWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate workflow parameter')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'workflows',
      'myWorkflow',
      'parameters',
      1,
    ])
    expect(problems[0].details).toEqual({ parameter: 'myParameter' })
  })
  test('should not detect unique workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [],
                query: {},
              },
              workflows: {
                myWorkflow: {
                  name: 'myWorkflow',
                  parameters: [
                    {
                      name: 'myParameter',
                      testValue: '1',
                    },
                    {
                      name: 'myOtherParameter',
                      testValue: '1',
                    },
                  ],
                  actions: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [duplicateWorkflowParameterRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
