import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { IssueResult } from '../../../types'
import { unknownVariableRule } from './unknownVariableRule'

describe('unknownVariable', () => {
  test('should report reading unknown variables', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Variables', 'unknown'],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
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
        rules: [unknownVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect((problems[0] as IssueResult).code).toBe('unknown variable')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should report references to unknown variables in workflow events/callbacks', () => {
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
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    callbacks: {
                      'test event': {
                        actions: [
                          {
                            name: '@toddle/logToConsole',
                            arguments: [
                              {
                                name: 'Label',
                                formula: { type: 'value', value: '' },
                              },
                              {
                                name: 'Data',
                                formula: {
                                  type: 'path',
                                  path: ['Variables', 'test'],
                                },
                              },
                            ],
                            label: 'Log to console',
                          },
                        ],
                      },
                    },
                    workflow: 'AsqRCv',
                    parameters: {},
                  },
                ],
              },
            },
          },
        },
        rules: [unknownVariableRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect((problems[0] as IssueResult).code).toBe('unknown variable')
    expect(problems[0].details).toEqual({ name: 'test' })
  })

  test('should not report variables that exist', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Variables', 'known'],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                known: {
                  initialValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownVariableRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
