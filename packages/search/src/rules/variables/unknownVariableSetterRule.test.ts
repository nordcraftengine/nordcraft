import { searchProject } from '../../searchProject'
import { unknownVariableSetterRule } from './unknownVariableSetterRule'

import { describe, expect, test } from 'bun:test'
describe('unknownVariableSetter', () => {
  test('should report setting unknown variables', () => {
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
                          type: 'SetVariable',
                          variable: 'unknown',
                          data: {
                            type: 'value',
                            value: null,
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
        rules: [unknownVariableSetterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown variable setter')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not report setting variables that exist', () => {
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
                    'my-event': {
                      trigger: 'my-event',
                      actions: [
                        {
                          type: 'SetVariable',
                          variable: 'known',
                          data: {
                            type: 'value',
                            value: null,
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
        rules: [unknownVariableSetterRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
