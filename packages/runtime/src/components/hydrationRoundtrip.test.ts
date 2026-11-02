import type { ComponentData, ToddleEnv } from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { createNode } from './createNode'
import { createHydrationState, sweepUnhydratedNodes } from './hydration'

const xhtml = 'http://www.w3.org/1999/xhtml' as any

const baseCtx = (component: any, extra: any = {}): ComponentContext =>
  ({
    isRootComponent: true,
    component,
    root: document,
    formulaCache: {},
    env: { runtime: 'page' } as ToddleEnv,
    stores: { theme: signal(null) },
    toddle: { getCustomFormula: () => undefined },
    children: {},
    providers: {},
    components: [],
    ...extra,
  }) as any as ComponentContext

function hydrateRoot({
  ctx,
  dataSignal,
  parentElement,
}: {
  ctx: ComponentContext
  dataSignal: any
  parentElement: Element
}) {
  const hydration = createHydrationState()
  createNode({
    ctx,
    namespace: xhtml,
    dataSignal,
    path: '0',
    id: 'root',
    parentElement,
    instance: {},
    hydration,
  })
  sweepUnhydratedNodes(parentElement, hydration)
}

// Snapshots of real `renderPageBody` output (see `bun roundtrip.ssr.ts`).
// They pin the SSR↔runtime path contract for components/slots in repeats.
const SSR_COMPONENT_IN_REPEAT =
  '<div data-id="0" data-node-id="root"><article data-id="0.0" data-node-id="root" class="Page:row AxitV"><div data-id="0.0.0" data-node-id="title"><span data-node-type="text" data-node-id="title-text" data-id="0.0.0.0">Alpha</span></div><img src="a.png" data-id="0.0.1" data-node-id="pic" /></article><article data-id="0.0(1)" data-node-id="root" class="Page:row cdJBav"><div data-id="0.0(1).0" data-node-id="title"><span data-node-type="text" data-node-id="title-text" data-id="0.0(1).0.0">Beta</span></div><img src="b.png" data-id="0.0(1).1" data-node-id="pic" /></article></div>'

const SSR_SLOTS_IN_REPEAT =
  '<div data-id="0" data-node-id="root"><section data-id="0.0" data-node-id="root" class="Page:row AxitV"><div data-id="0.0.0[default]" data-node-id="cell"><span data-node-type="text" data-node-id="t" data-id="0.0.0[default].0">Alpha</span></div></section><section data-id="0.0(1)" data-node-id="root" class="Page:row cdJBav"><div data-id="0.0(1).0[default](1)" data-node-id="cell"><span data-node-type="text" data-node-id="t" data-id="0.0(1).0[default](1).0">Beta</span></div></section></div>'

describe('hydration round-trips (real SSR markup)', () => {
  test('component-in-repeat hydrates without flipping or rebuilding', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML = SSR_COMPONENT_IN_REPEAT
    const ssrArticles = [...parentElement.querySelectorAll('article')]
    const card: any = {
      name: 'Card',
      nodes: {
        root: {
          type: 'element',
          tag: 'article',
          children: ['title', 'pic'],
          attrs: {},
          events: {},
        },
        title: {
          type: 'element',
          tag: 'div',
          children: ['title-text'],
          attrs: {},
          events: {},
        },
        'title-text': {
          type: 'text',
          value: { type: 'path', path: ['Attributes', 'heading'] },
        },
        pic: {
          type: 'element',
          tag: 'img',
          children: [],
          attrs: { src: { type: 'path', path: ['Attributes', 'src'] } },
          events: {},
        },
      },
    }
    const page: any = {
      name: 'Page',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['row'],
          attrs: {},
          events: {},
        },
        row: {
          type: 'component',
          name: 'Card',
          repeat: {
            type: 'value',
            value: [
              { id: 'a', heading: 'Alpha', src: 'a.png' },
              { id: 'b', heading: 'Beta', src: 'b.png' },
            ],
          },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: [],
          attrs: {
            heading: { type: 'path', path: ['ListItem', 'Item', 'heading'] },
            src: { type: 'path', path: ['ListItem', 'Item', 'src'] },
          },
          events: {},
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    hydrateRoot({
      ctx: baseCtx(page, { components: [card] }),
      dataSignal,
      parentElement,
    })
    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(2)
    expect(root.children[0]).toBe(ssrArticles[0])
    expect(root.children[1]).toBe(ssrArticles[1])
    for (const article of root.children) {
      expect([...article.children].map((c) => c.tagName.toLowerCase())).toEqual(
        ['div', 'img'],
      )
    }
    dataSignal.destroy()
    parentElement.remove()
  })

  test('slots-in-repeat hydrate without flipping or rebuilding', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML = SSR_SLOTS_IN_REPEAT
    const ssrSections = [...parentElement.querySelectorAll('section')]
    const layout: any = {
      name: 'Layout',
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          children: ['slot-1'],
          attrs: {},
          events: {},
        },
        'slot-1': { type: 'slot', children: [] },
      },
    }
    const page: any = {
      name: 'Page',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['row'],
          attrs: {},
          events: {},
        },
        row: {
          type: 'component',
          name: 'Layout',
          repeat: {
            type: 'value',
            value: [
              { id: 'a', label: 'Alpha' },
              { id: 'b', label: 'Beta' },
            ],
          },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['cell'],
          attrs: {},
          events: {},
        },
        cell: {
          type: 'element',
          tag: 'div',
          children: ['t'],
          attrs: {},
          events: {},
          slot: 'default',
        },
        t: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'label'] },
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    hydrateRoot({
      ctx: baseCtx(page, { components: [layout] }),
      dataSignal,
      parentElement,
    })
    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(2)
    expect(root.children[0]).toBe(ssrSections[0])
    expect(root.children[1]).toBe(ssrSections[1])
    expect(root.children[0].textContent).toBe('Alpha')
    expect(root.children[1].textContent).toBe('Beta')
    dataSignal.destroy()
    parentElement.remove()
  })

  test('object-based repeat hydrates and updates reactively', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML =
      '<ul data-id="0" data-node-id="root">' +
      '<li data-id="0.0" data-node-id="item"><span data-node-type="text" data-node-id="txt" data-id="0.0.0">First</span></li>' +
      '<li data-id="0.0(1)" data-node-id="item"><span data-node-type="text" data-node-id="txt" data-id="0.0(1).0">Second</span></li>' +
      '</ul>'
    const ssrItems = [...parentElement.querySelectorAll('li')]
    const page: any = {
      name: 'ObjectRepeatPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'ul',
          children: ['item'],
          attrs: {},
          events: {},
        },
        item: {
          type: 'element',
          tag: 'li',
          repeat: { type: 'path', path: ['Variables', 'dict'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Key'] },
          children: ['txt'],
          attrs: {},
          events: {},
        },
        txt: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item'] },
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        dict: { a: 'First', b: 'Second' },
      },
    })
    hydrateRoot({
      ctx: baseCtx(page),
      dataSignal,
      parentElement,
    })
    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(2)
    expect(root.children[0]).toBe(ssrItems[0])
    expect(root.children[1]).toBe(ssrItems[1])

    // Update object entries: preserve 'b', update 'a', add 'c'
    dataSignal.update((d) => ({
      ...d,
      Variables: {
        dict: { b: 'Second-updated', a: 'First-updated', c: 'Third' },
      },
    }))
    expect(root.children.length).toBe(3)
    expect(root.children[0]).toBe(ssrItems[1])
    expect(root.children[1]).toBe(ssrItems[0])
    expect([...root.children].map((c) => c.textContent)).toEqual([
      'Second-updated',
      'First-updated',
      'Third',
    ])

    dataSignal.destroy()
    parentElement.remove()
  })
})
