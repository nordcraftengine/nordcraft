import { searchProject } from '../../searchProject'
import { noReferenceComponentWorkflowRule } from './noReferenceComponentWorkflowRule'

import { describe, expect, test } from 'bun:test'
describe('noReferenceComponentWorkflowRule', () => {
  test('should detect component workflows with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  classes: {},
                  style: {},
                  events: {},
                },
              },
              workflows: {
                'my-workflow': {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component workflow')
    expect(problems[0].path).toEqual([
      'components',
      'page',
      'workflows',
      'my-workflow',
    ])
  })

  test('should not detect component workflows with references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'page',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  classes: {},
                  style: {},
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
                },
              },
              workflows: {
                'my-workflow': {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentWorkflowRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect component workflows with references through context', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'page',
              nodes: {},
              workflows: {
                'my-workflow': {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
            'my-component': {
              name: 'my-component',
              nodes: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'load',
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'my-workflow',
                    contextProvider: 'page',
                    parameters: {},
                  },
                ],
              },
              contexts: {
                page: {
                  formulas: [],
                  workflows: ['my-workflow'],
                },
              },
            },
          },
        },
        rules: [noReferenceComponentWorkflowRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should report when subscribed, but no usage', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              workflows: {
                'my-workflow': {
                  actions: [],
                  name: 'my-workflow',
                  parameters: [],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
            'my-component': {
              name: 'my-component',
              nodes: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                page: {
                  formulas: [],
                  workflows: ['my-workflow'],
                },
              },
            },
          },
        },
        rules: [noReferenceComponentWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component workflow')
    expect(problems[0].details).toEqual({
      contextSubscribers: ['my-component'],
      name: 'my-workflow',
    })
  })
  test('should detect component workflows with only self reference', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              workflows: {
                'my-workflow': {
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      workflow: 'my-workflow',
                      parameters: {},
                    },
                  ],
                  name: 'my-workflow',
                  parameters: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component workflow')
    expect(problems[0].path).toEqual([
      'components',
      'page',
      'workflows',
      'my-workflow',
    ])
  })
})
