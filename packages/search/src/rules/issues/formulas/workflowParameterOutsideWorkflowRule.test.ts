import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { workflowParameterOutsideWorkflowRule } from './workflowParameterOutsideWorkflowRule'

describe('workflowParameterOutsideWorkflowRule', () => {
  test('should detect path formulas starting with Parameters outside a workflow', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Parameters', 'someParam'],
                      },
                    },
                  },
                  events: {},
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [workflowParameterOutsideWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid path formula')
    expect(problems[0].info.title).toBe('Invalid workflow parameter reference')
  })

  test('should not detect path formulas starting with Parameters inside a workflow', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                myWorkflow: {
                  name: 'myWorkflow',
                  parameters: [],
                  actions: [
                    {
                      type: 'TriggerEvent',
                      event: 'test',
                      data: {
                        type: 'path',
                        path: ['Parameters', 'someParam'],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        rules: [workflowParameterOutsideWorkflowRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect other path formulas outside a workflow', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Args', 'someArg'],
                      },
                    },
                  },
                  events: {},
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [workflowParameterOutsideWorkflowRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
