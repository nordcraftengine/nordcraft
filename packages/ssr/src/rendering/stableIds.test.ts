import type { Component } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { renderPageBody } from './components'
import { getPageFormulaContext } from './formulaContext'

const render = ({
  component,
  components,
}: {
  component: Component
  components?: Record<string, Component>
}) => {
  const files = {
    components: { [component.name]: component, ...components },
  } as any
  return renderPageBody({
    evaluateComponentApis: () => ({}) as any,
    component: component as any,
    formulaContext: getPageFormulaContext({
      component: component as any,
      branchName: 'main',
      req: new Request('http://localhost'),
      logErrors: true,
      files,
    }),
    env: {} as any,
    files,
    includedComponents: [component, ...Object.values(components ?? {})],
    projectId: 'test-project',
    req: {} as any,
  })
}

const dataIds = (html: string) =>
  [...html.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]!)

describe('stable data-ids (hydration contract)', () => {
  test('repeat items use the initial-render contract: base, base(1), base(2)', async () => {
    const component = {
      name: 'RepeatPage',
      route: { path: [], query: {} },
      variables: {
        items: {
          initialValue: { type: 'value', value: ['a', 'b', 'c'] },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'ul',
          attrs: {},
          events: {},
          children: ['row'],
        },
        row: {
          type: 'element',
          tag: 'li',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          attrs: {},
          events: {},
          children: ['label'],
        },
        label: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item'] },
        },
      },
    } as unknown as Component

    const { html } = await render({ component })
    // Document order: each repeat item is followed by its children.
    expect(dataIds(html)).toEqual([
      '0',
      '0.0',
      // text children of each repeat item
      '0.0.0',
      '0.0(1)',
      '0.0(1).0',
      '0.0(2)',
      '0.0(2).0',
    ])
  })

  test('repeat data-ids are deterministic across renders', async () => {
    const component = {
      name: 'RepeatPage',
      route: { path: [], query: {} },
      variables: {
        items: {
          initialValue: { type: 'value', value: [1, 2, 3, 4] },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: ['row'],
        },
        row: {
          type: 'element',
          tag: 'div',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    const first = await render({ component })
    const second = await render({ component })
    expect(dataIds(first.html)).toEqual(dataIds(second.html))
    expect(dataIds(first.html)).toEqual([
      '0',
      '0.0',
      '0.0(1)',
      '0.0(2)',
      '0.0(3)',
    ])
  })

  test('every SSR node (including text) carries a unique data-id', async () => {
    const component = {
      name: 'MixedPage',
      route: { path: [], query: {} },
      variables: {
        items: {
          initialValue: { type: 'value', value: ['a', 'b'] },
        },
        show: {
          initialValue: { type: 'value', value: true },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: ['title', 'row', 'conditional'],
        },
        title: {
          type: 'text',
          value: { type: 'value', value: 'hello' },
        },
        row: {
          type: 'element',
          tag: 'span',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          attrs: {},
          events: {},
          children: [],
        },
        conditional: {
          type: 'element',
          tag: 'em',
          condition: { type: 'path', path: ['Variables', 'show'] },
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    const { html } = await render({ component })
    const ids = dataIds(html)
    // root div + title text + 2 repeat items + conditional
    expect(ids).toEqual(['0', '0.0', '0.1', '0.1(1)', '0.2'])
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('hidden conditionals render no anchor; visible ones keep their path', async () => {
    const make = (show: boolean) =>
      ({
        name: 'CondPage',
        route: { path: [], query: {} },
        variables: {
          show: { initialValue: { type: 'value', value: show } },
        },
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            attrs: {},
            events: {},
            children: ['maybe'],
          },
          maybe: {
            type: 'element',
            tag: 'span',
            condition: { type: 'path', path: ['Variables', 'show'] },
            attrs: {},
            events: {},
            children: [],
          },
        },
      }) as unknown as Component

    const hidden = await render({ component: make(false) })
    expect(dataIds(hidden.html)).toEqual(['0'])
    const visible = await render({ component: make(true) })
    expect(dataIds(visible.html)).toEqual(['0', '0.0'])
  })

  test('duplicate slot names stay unique and stable', async () => {
    const layout: Component = {
      name: 'TwoSlots',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['slot-1', 'slot-2'],
          attrs: {},
          events: {},
        },
        'slot-1': { type: 'slot', children: [] },
        'slot-2': { type: 'slot', children: [] },
      },
    } as unknown as Component
    const page = {
      name: 'SlotPage',
      route: { path: [], query: {} },
      nodes: {
        root: {
          type: 'component',
          name: 'TwoSlots',
          attrs: {},
          events: {},
          children: ['slotted'],
        },
        slotted: {
          type: 'element',
          tag: 'span',
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    const first = await render({
      component: page,
      components: { TwoSlots: layout },
    })
    const second = await render({
      component: page,
      components: { TwoSlots: layout },
    })
    expect(dataIds(first.html)).toEqual([
      '0',
      '0.0[default]',
      '0.0[default]{1}',
    ])
    expect(dataIds(first.html)).toEqual(dataIds(second.html))
  })
})
