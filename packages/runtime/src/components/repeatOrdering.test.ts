import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { describe, expect, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { createNode } from './createNode'

const xhtml = 'http://www.w3.org/1999/xhtml' as any

// Deterministic PRNG (mulberry32)
function rng(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('repeat ordering', () => {
  test('random shuffle/remove/add ops keep DOM order === data order', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    let items = [0, 1, 2, 3, 4].map((id) => ({ id: String(id) }))
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items },
    })
    const ctx = {
      isRootComponent: false,
      component: {
        name: 'P',
        nodes: {
          row: {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['t'],
            attrs: {},
            events: {},
          },
          t: {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          },
        },
      },
      root: document,
      formulaCache: {},
      env: { runtime: 'page' } as ToddleEnv,
      stores: { theme: signal(null) },
      toddle: { getCustomFormula: () => undefined },
      children: {},
      providers: {},
      components: [],
    } as any as ComponentContext
    const nodes = createNode({
      ctx,
      namespace: xhtml,
      dataSignal,
      path: '0',
      id: 'row',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    const rand = rng(42)
    let nextId = 5
    for (let step = 0; step < 60; step++) {
      const op = rand()
      const copy = [...items]
      if (op < 0.45) {
        // shuffle
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1))
          ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
        }
      } else if (op < 0.7 && copy.length > 1) {
        // remove random
        copy.splice(Math.floor(rand() * copy.length), 1)
      } else {
        // add random (append or prepend)
        const fresh = { id: String(nextId++) }
        if (rand() < 0.5) copy.unshift(fresh)
        else copy.push(fresh)
      }
      items = copy
      const snapshot = items.map((x) => x.id)
      dataSignal.update((d) => ({ ...d, Variables: { items: copy } }))
      const domOrder = [...parentElement.children].map((c) => c.textContent)
      expect(domOrder).toEqual(snapshot)
      // ids stay unique
      const ids = [...parentElement.children].map((c) =>
        c.getAttribute('data-id'),
      )
      expect(new Set(ids).size).toBe(ids.length)
    }
    dataSignal.destroy()
    parentElement.remove()
  })
})

const tags = (el: Element): string[] =>
  [...el.children].map((c) => c.tagName.toLowerCase())

const slottedCtx = (component: any, extra: any = {}): ComponentContext =>
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

describe('fresh items added to slotted-component repeats', () => {
  test('newly built items keep child order', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
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
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['cell-a', 'cell-b'],
          attrs: {},
          events: {},
        },
        'cell-a': {
          type: 'element',
          tag: 'div',
          children: ['ta'],
          attrs: {},
          events: {},
          slot: 'default',
        },
        ta: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'label'] },
        },
        'cell-b': {
          type: 'element',
          tag: 'img',
          children: [],
          attrs: { src: { type: 'value', value: 'x' } },
          events: {},
          slot: 'default',
        },
      },
    }
    const i1 = { id: '1', label: 'one' }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items: [i1] },
    })
    const ctx = slottedCtx(page, { components: [layout] })
    const nodes = createNode({
      ctx,
      namespace: xhtml,
      dataSignal,
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)
    const root = parentElement.querySelector('[data-id="0"]')!
    const section = (el: Element) =>
      [...el.querySelectorAll('section')].map((s) => tags(s))
    expect(section(root)).toEqual([['div', 'img']])

    // Add a fresh item (pure build, no SSR)
    const i2 = { id: '2', label: 'two' }
    dataSignal.update((d) => ({ ...d, Variables: { items: [i1, i2] } }))
    expect(root.querySelectorAll('section').length).toBe(2)
    expect(section(root)).toEqual([
      ['div', 'img'],
      ['div', 'img'],
    ])

    // And prepend one more
    const i0 = { id: '0', label: 'zero' }
    dataSignal.update((d) => ({
      ...d,
      Variables: { items: [i0, i1, i2] },
    }))
    expect(root.querySelectorAll('section').length).toBe(3)
    expect(section(root)).toEqual([
      ['div', 'img'],
      ['div', 'img'],
      ['div', 'img'],
    ])
    dataSignal.destroy()
    parentElement.remove()
  })

  test('repeat starting empty, batch-added items keep child order', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
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
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['cell-a', 'cell-b'],
          attrs: {},
          events: {},
        },
        'cell-a': {
          type: 'element',
          tag: 'div',
          children: ['ta'],
          attrs: {},
          events: {},
          slot: 'default',
        },
        ta: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'label'] },
        },
        'cell-b': {
          type: 'element',
          tag: 'img',
          children: [],
          attrs: { src: { type: 'value', value: 'x' } },
          events: {},
          slot: 'default',
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items: [] },
    })
    const ctx = slottedCtx(page, { components: [layout] })
    const nodes = createNode({
      ctx,
      namespace: xhtml,
      dataSignal,
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)
    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.querySelectorAll('section').length).toBe(0)

    dataSignal.update((d) => ({
      ...d,
      Variables: {
        items: [
          { id: '1', label: 'one' },
          { id: '2', label: 'two' },
        ],
      },
    }))
    const sections = root.querySelectorAll('section')
    expect(sections.length).toBe(2)
    for (const s of sections) {
      expect(tags(s)).toEqual(['div', 'img'])
    }
    dataSignal.destroy()
    parentElement.remove()
  })

  test('slotted children under hydration keep child order even when fallback-created', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
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
          children: ['cell-a', 'cell-b'],
          attrs: {},
          events: {},
        },
        'cell-a': {
          type: 'element',
          tag: 'div',
          children: [],
          attrs: {},
          events: {},
          slot: 'default',
        },
        'cell-b': {
          type: 'element',
          tag: 'img',
          children: [],
          attrs: { src: { type: 'value', value: 'x' } },
          events: {},
          slot: 'default',
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = slottedCtx(page, { components: [layout] })
    // Simulate SSR parent claimed, but slotted children are fallback-created (SSR skew)
    parentElement.innerHTML =
      '<div data-id="0"><section data-id="0.0"></section></div>'
    const hydration: any = {
      adopted: new Set(),
      sealed: false,
      claimedCount: 0,
      createdPaths: [],
      sweptPaths: [],
    }
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
    const section = parentElement.querySelector('section')!
    expect(tags(section)).toEqual(['div', 'img'])
    dataSignal.destroy()
    parentElement.remove()
  })
})
