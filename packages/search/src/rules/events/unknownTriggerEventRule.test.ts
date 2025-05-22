import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { searchProject } from '../../searchProject'
import { unknownTriggerEventRule } from './unknownTriggerEventRule'

import { describe, expect, test } from 'bun:test'
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
                  // eslint-disable-next-line inclusive-language/use-inclusive-words
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
                  // eslint-disable-next-line inclusive-language/use-inclusive-words
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
