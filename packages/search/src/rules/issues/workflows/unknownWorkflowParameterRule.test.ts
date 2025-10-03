import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownWorkflowParameterRule } from './unknownWorkflowParameterRule'

describe('unknownWorkflowParameterRule', () => {
  test('should detect unknown workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                ['my-workflow']: {
                  name: 'my-workflow',
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
                    },
                  ],
                  actions: [
                    {
                      name: '@toddle/logToConsole',
                      label: 'Log to console',
                      arguments: [
                        {
                          name: 'Label',
                          formula: { type: 'value', value: 'first p' },
                        },
                        {
                          name: 'Data',
                          formula: {
                            path: ['Parameters', 'unknownParameter'],
                            type: 'path',
                          },
                        },
                      ],
                    },
                  ],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown workflow parameter')
    expect(problems[0].details).toEqual({ parameter: 'unknownParameter' })
  })
  test('should not detect known workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                ['my-workflow']: {
                  name: 'my-workflow',
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
                    },
                  ],
                  actions: [
                    {
                      name: '@toddle/logToConsole',
                      label: 'Log to console',
                      arguments: [
                        {
                          name: 'Label',
                          formula: { type: 'value', value: 'first p' },
                        },
                        {
                          name: 'Data',
                          formula: {
                            path: ['Parameters', 'parameter'],
                            type: 'path',
                          },
                        },
                      ],
                    },
                  ],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
