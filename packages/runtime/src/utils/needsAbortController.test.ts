import type { Component } from '@nordcraft/core'
import { valueFormula } from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import { needsAbortController } from './needsAbortController'

const baseComponent = (overrides: Partial<Component> = {}): Component => ({
  name: 'TestComponent',
  nodes: {
    root: {
      type: 'element',
      tag: 'div',
      attrs: {},
      style: {},
      events: {},
      classes: {},
      children: [],
    },
  },
  ...overrides,
})

describe('needsAbortController', () => {
  test('returns false for a presentational component with no apis, lifecycle actions, workflows, or events', () => {
    expect(needsAbortController(baseComponent())).toBe(false)
    expect(
      needsAbortController(
        baseComponent({
          apis: {},
          workflows: {},
          onLoad: { trigger: 'Load', actions: [] },
          onAttributeChange: { trigger: 'Attribute change', actions: [] },
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {},
              style: {},
              events: {},
              classes: {},
              children: ['text', 'slot'],
            },
            text: {
              type: 'text',
              value: valueFormula('hello'),
            },
            slot: {
              type: 'slot',
              children: [],
            },
          },
        }),
      ),
    ).toBe(false)
  })

  test('returns false when apis, workflows, or node events only contain nullish entries', () => {
    expect(
      needsAbortController(
        baseComponent({
          apis: { removed: null },
          workflows: { removed: null },
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {},
              style: {},
              events: { click: null },
              classes: {},
              children: [],
            },
          },
        }),
      ),
    ).toBe(false)
  })

  test('returns true when component has a defined API', () => {
    expect(
      needsAbortController(
        baseComponent({
          apis: {
            fetchUsers: {
              name: 'fetchUsers',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(true),
              url: valueFormula('https://example.com'),
              inputs: {},
            },
          },
        }),
      ),
    ).toBe(true)
  })

  test('returns true when component has onLoad actions', () => {
    expect(
      needsAbortController(
        baseComponent({
          onLoad: {
            trigger: 'Load',
            actions: [
              {
                type: 'SetVariable',
                variable: 'ready',
                data: valueFormula(true),
              },
            ],
          },
        }),
      ),
    ).toBe(true)
  })

  test('returns true when component has onAttributeChange actions', () => {
    expect(
      needsAbortController(
        baseComponent({
          onAttributeChange: {
            trigger: 'Attribute change',
            actions: [
              {
                type: 'SetVariable',
                variable: 'changed',
                data: valueFormula(true),
              },
            ],
          },
        }),
      ),
    ).toBe(true)
  })

  test('returns true when component has a defined workflow', () => {
    expect(
      needsAbortController(
        baseComponent({
          workflows: {
            submit: {
              name: 'submit',
              parameters: [],
              actions: [],
            },
          },
        }),
      ),
    ).toBe(true)
  })

  test('returns true when an element node has a defined event', () => {
    expect(
      needsAbortController(
        baseComponent({
          nodes: {
            root: {
              type: 'element',
              tag: 'button',
              attrs: {},
              style: {},
              events: {
                click: {
                  trigger: 'click',
                  actions: [],
                },
              },
              classes: {},
              children: [],
            },
          },
        }),
      ),
    ).toBe(true)
  })

  test('returns true when a child component node has a defined event', () => {
    expect(
      needsAbortController(
        baseComponent({
          nodes: {
            root: {
              type: 'component',
              name: 'ChildComponent',
              attrs: {},
              events: {
                done: {
                  trigger: 'done',
                  actions: [],
                },
              },
              children: [],
            },
          },
        }),
      ),
    ).toBe(true)
  })

  test('caches the result per component object reference', () => {
    const component = baseComponent()
    expect(needsAbortController(component)).toBe(false)

    // Mutating in place still returns the cached value for the same reference
    component.onLoad = {
      trigger: 'Load',
      actions: [{ type: 'SetVariable', variable: 'x', data: valueFormula(1) }],
    }
    expect(needsAbortController(component)).toBe(false)

    // A new component reference with the same shape is evaluated freshly
    expect(needsAbortController({ ...component })).toBe(true)
  })
})
