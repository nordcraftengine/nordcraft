import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownContextProviderWorkflowRule } from './unknownContextProviderWorkflowRule'

describe('unknownContextProviderWorkflowRule', () => {
  test('should detect invalid context provider workflow references', () => {
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
              workflows: {},
            },
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
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
        rules: [unknownContextProviderWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown context provider workflow')
    expect(problems[0].details).toEqual({
      providerName: 'known',
      workflowName: 'test',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                test: {
                  actions: [],
                  name: 'test',
                  parameters: [],
                  exposeInContext: false,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
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
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextProviderWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown context provider workflow')
    expect(problems[0].details).toEqual({
      providerName: 'known',
      workflowName: 'test',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                test: {
                  actions: [],
                  name: 'test',
                  parameters: [],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
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
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextProviderWorkflowRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
