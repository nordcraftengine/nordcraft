import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownTriggerWorkflowParameterRule } from './unknownTriggerWorkflowParameterRule'

describe('unknownTriggerWorkflowParameterRule', () => {
  test('should detect unknown workflow parameters', () => {
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
                          parameters: {
                            unknownParameter: {
                              formula: valueFormula(4),
                            },
                          },
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
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
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
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown trigger workflow parameter')
    expect(problems[0].details).toEqual({ parameter: 'unknownParameter' })
  })
  test('should not fail on valid workflow parameters', () => {
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
                          parameters: {
                            parameter: {
                              formula: valueFormula(4),
                            },
                          },
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
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
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
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
  test('should detect unknown workflow parameters in context workflows', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {
                root: {
                  type: 'component',
                  name: 'consumer',
                  attrs: {},
                  children: [],
                  events: {},
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
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
                    },
                  ],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
            consumer: {
              name: 'consumer',
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
                          contextProvider: 'bla',
                          parameters: {
                            unknownParameter: {
                              formula: valueFormula(4),
                            },
                          },
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
              contexts: {
                bla: {
                  workflows: ['my-workflow'],
                  formulas: [],
                  componentName: 'myComponent',
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown trigger workflow parameter')
    expect(problems[0].details).toEqual({ parameter: 'unknownParameter' })
  })
  test('should not fail on valid context workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComponent: {
              name: 'myComponent',
              nodes: {
                root: {
                  type: 'component',
                  name: 'consumer',
                  attrs: {},
                  children: [],
                  events: {},
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
                  parameters: [
                    {
                      name: 'parameter',
                      testValue: 4,
                    },
                  ],
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
            consumer: {
              name: 'consumer',
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
                          contextProvider: 'bla',
                          parameters: {
                            parameter: {
                              formula: valueFormula(4),
                            },
                          },
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
              contexts: {
                bla: {
                  workflows: ['my-workflow'],
                  formulas: [],
                  componentName: 'myComponent',
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
  test('should detect unknown workflow parameters in context workflows from packages', () => {
    const problems = Array.from(
      searchProject({
        files: {
          packages: {
            myPackage: {
              manifest: {
                commit: 'commit',
                name: 'myPackage',
              },
              components: {
                myComponent: {
                  name: 'myComponent',
                  nodes: {},
                  formulas: {},
                  apis: {},
                  attributes: {},
                  variables: {},
                  workflows: {
                    ['package-workflow']: {
                      actions: [],
                      name: 'package-workflow',
                      parameters: [
                        {
                          name: 'parameter',
                          testValue: 4,
                        },
                      ],
                      exposeInContext: true,
                      '@nordcraft/metadata': {
                        comments: null,
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            consumer: {
              name: 'consumer',
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
                          workflow: 'package-workflow',
                          contextProvider: 'bla',
                          parameters: {
                            unknownParameter: {
                              formula: valueFormula(4),
                            },
                          },
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
              contexts: {
                bla: {
                  workflows: ['package-workflow'],
                  formulas: [],
                  componentName: 'myComponent',
                  package: 'myPackage',
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown trigger workflow parameter')
    expect(problems[0].details).toEqual({ parameter: 'unknownParameter' })
  })
  test('should not fail on valid package workflow parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          packages: {
            myPackage: {
              manifest: {
                commit: 'commit',
                name: 'myPackage',
              },
              components: {
                myComponent: {
                  name: 'myComponent',
                  nodes: {},
                  formulas: {},
                  apis: {},
                  attributes: {},
                  variables: {},
                  workflows: {
                    ['package-workflow']: {
                      actions: [],
                      name: 'package-workflow',
                      parameters: [
                        {
                          name: 'parameter',
                          testValue: 4,
                        },
                      ],
                      exposeInContext: true,
                      '@nordcraft/metadata': {
                        comments: null,
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            consumer: {
              name: 'consumer',
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
                          workflow: 'package-workflow',
                          contextProvider: 'bla',
                          parameters: {
                            parameter: {
                              formula: valueFormula(4),
                            },
                          },
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
              contexts: {
                bla: {
                  workflows: ['package-workflow'],
                  formulas: [],
                  componentName: 'myComponent',
                  package: 'myPackage',
                },
              },
            },
          },
        },
        rules: [unknownTriggerWorkflowParameterRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
