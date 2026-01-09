import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { duplicateEventTriggerRule } from './duplicateEventTriggerRule'

describe('duplicateEventTriggerRule', () => {
  test('should detect duplicate event triggers', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                n1: {
                  type: 'element',
                  tag: 'button',
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [],
                    },
                    otherEvent: {
                      trigger: 'click',
                      actions: [],
                    },
                  },
                  attrs: {},
                  style: {},
                  children: [],
                  classes: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateEventTriggerRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate event trigger')
    expect(problems[0].details).toEqual({ trigger: 'click' })
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'n1',
      'events',
      'otherEvent',
    ])
  })
  test('should not detect events that do not have duplicate triggers', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                n1: {
                  type: 'element',
                  tag: 'button',
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [],
                    },
                    otherEvent: {
                      trigger: 'mouseenter',
                      actions: [],
                    },
                  },
                  attrs: {},
                  style: {},
                  children: [],
                  classes: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [duplicateEventTriggerRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
