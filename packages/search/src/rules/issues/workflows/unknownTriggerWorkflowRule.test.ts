import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownTriggerWorkflowRule } from './unknownTriggerWorkflowRule'

describe('unknownTriggerWorkflowRule', () => {
  test('should detect unknown workflows', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'unknown-workflow',
                          parameters: {},
                        },
                      ],
                    },
                  },
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                ['my-workflow']: {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown trigger workflow')
  })
  test('should not fail on valid workflow triggers', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'my-workflow',
                          parameters: {},
                        },
                      ],
                    },
                  },
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                ['my-workflow']: {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
