import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { createActionNameRule } from './createActionNameRule'

describe('createActionNameRule', () => {
  test('should report use of console log', () => {
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
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'Switch',
                          cases: [
                            {
                              condition: {
                                type: 'function',
                                name: '@toddle/notEqual',
                                arguments: [
                                  {
                                    name: 'First',
                                    formula: {
                                      type: 'value',
                                      value: false,
                                    },
                                  },
                                  {
                                    name: 'Second',
                                    formula: {
                                      type: 'value',
                                      value: true,
                                    },
                                  },
                                ],
                              },
                              actions: [
                                {
                                  name: '@toddle/logToConsole',
                                  arguments: [
                                    {
                                      name: 'Label',
                                      formula: {
                                        type: 'value',
                                        value: 'my',
                                      },
                                    },
                                    {
                                      name: 'Data',
                                      formula: {
                                        type: 'value',
                                        value: 'message',
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          default: {
                            actions: [],
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
            },
          },
        },
        rules: [
          createActionNameRule({
            name: '@toddle/logToConsole',
            code: 'no-console',
          }),
        ],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-console')
    expect(problems[0].level).toEqual('info')
  })
})
