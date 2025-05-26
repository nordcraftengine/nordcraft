import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { unknownComponentSlotRule } from './unknownComponentSlotRule'

describe('unknownComponentSlotRule', () => {
  test('should detect elements in unknown component slots', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            noSlotComponent: {
              name: 'noSlotComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
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
            attemptToUseNoSlotComponent: {
              name: 'attemptToUseNoSlotComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['noSlotComponent'],
                  style: {},
                },
                noSlotComponent: {
                  name: 'noSlotComponent',
                  attrs: {},
                  events: {},
                  type: 'component',
                  children: ['divInUnknownSlot', 'divInUnknownSlot2'],
                },
                divInUnknownSlot: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
                divInUnknownSlot2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                  slot: 'unknown',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentSlotRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown component slot')
    expect(problems[0].details).toEqual({ slotName: 'default' })
    expect(problems[1].code).toBe('unknown component slot')
    expect(problems[1].details).toEqual({ slotName: 'unknown' })
  })

  test('should pass when using existing slots', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            slotComponent: {
              name: 'slotComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
                default: {
                  type: 'slot',
                  children: [],
                },
                slot: {
                  type: 'slot',
                  children: [],
                  name: 'slot',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            attemptToUseSlotComponent: {
              name: 'attemptToUseSlotComponent',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['slotComponent'],
                  style: {},
                },
                slotComponent: {
                  name: 'slotComponent',
                  attrs: {},
                  events: {},
                  type: 'component',
                  children: ['divInKnownSlot', 'divInKnownSlot2'],
                },
                divInKnownSlot: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
                divInKnownSlot2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                  slot: 'slot',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentSlotRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
