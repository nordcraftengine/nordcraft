import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownTriggerEventRule } from './unknownTriggerEventRule'

describe('unknownTriggerEventRule', () => {
  test('should report unknown trigger events', () => {
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
                          type: 'TriggerEvent',
                          event: 'unknown-event',
                          data: valueFormula(null),
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
              events: [
                {
                  name: 'known-event',
                  dummyEvent: {
                    name: 'Name',
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              ],
            },
          },
        },
        rules: [unknownTriggerEventRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown trigger event')
    expect(problems[0].details).toEqual({ name: 'unknown-event' })
  })

  test('should not report events that exist', () => {
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
                          type: 'TriggerEvent',
                          event: 'known-event',
                          data: valueFormula(null),
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
              events: [
                {
                  name: 'known-event',
                  dummyEvent: {
                    name: 'Name',
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              ],
            },
          },
        },
        rules: [unknownTriggerEventRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
