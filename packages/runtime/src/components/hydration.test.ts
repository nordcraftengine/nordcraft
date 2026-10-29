/* eslint-disable no-console */
import type {
  ComponentData,
  SupportedNamespaces,
  ToddleEnv,
} from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { createNode } from './createNode'
import {
  claimHydratedChild,
  createHydrationState,
  hasHydratableContent,
  hydrationTagMatches,
  noteHydrationFallback,
  peekHydratedChild,
  reportHydrationResult,
  sweepUnhydratedNodes,
} from './hydration'
import { renderComponent } from './renderComponent'

const xhtml = 'http://www.w3.org/1999/xhtml' as SupportedNamespaces

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

const dataIds = (root: Element | ShadowRoot): Array<string | null> =>
  [...root.querySelectorAll('[data-id]')].map((el) =>
    el.getAttribute('data-id'),
  )

const tags = (el: Element): string[] =>
  [...el.children].map((c) => c.tagName.toLowerCase())

const hydrate = ({
  ctx,
  dataSignal,
  parentElement,
  path,
  id,
  namespace = xhtml,
}: {
  ctx: ComponentContext
  dataSignal: ReturnType<typeof signal<ComponentData>>
  parentElement: Element
  path: string
  id: string
  namespace?: SupportedNamespaces
}) => {
  const hydration = createHydrationState()
  const nodes = createNode({
    ctx,
    namespace,
    dataSignal,
    path,
    id,
    parentElement,
    instance: {},
    hydration,
  })
  sweepUnhydratedNodes(parentElement, hydration)
  return { nodes, hydration }
}

describe('hydration helpers', () => {
  test('hasHydratableContent detects SSR anchors', () => {
    const empty = document.createElement('div')
    expect(hasHydratableContent(empty)).toBe(false)
    const ssr = document.createElement('div')
    ssr.innerHTML = '<div data-id="0"></div>'
    expect(hasHydratableContent(ssr)).toBe(true)
  })

  test('hydrationTagMatches compares case-insensitively', () => {
    const el = document.createElement('div')
    expect(hydrationTagMatches(el, 'div')).toBe(true)
    expect(hydrationTagMatches(el, 'DIV')).toBe(true)
    expect(hydrationTagMatches(el, 'span')).toBe(false)
  })

  test('claimHydratedChild adopts once; peek does not adopt', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<div data-id="0"></div><span data-id="0.0">x</span>'
    const hydration = createHydrationState()
    const first = claimHydratedChild(parent, '0.0', hydration)!
    expect(first.tagName).toBe('SPAN')
    // Already adopted — second claim misses
    expect(claimHydratedChild(parent, '0.0', hydration)).toBeNull()
    // Peek finds without adopting
    const other = createHydrationState()
    expect(peekHydratedChild(parent, '0')).not.toBeNull()
    expect(other.adopted.size).toBe(0)
    expect(claimHydratedChild(parent, '0', other)).not.toBeNull()
  })

  test('sweepUnhydratedNodes removes only stale data-id nodes', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<div data-id="0"><span data-id="0.0">keep</span></div><div data-id="stale">old</div><div class="overlay">foreign</div>'
    const hydration = createHydrationState()
    claimHydratedChild(parent, '0', hydration)
    claimHydratedChild(parent.children[0]!, '0.0', hydration)
    sweepUnhydratedNodes(parent, hydration)
    expect(parent.querySelector('[data-id="stale"]')).toBeNull()
    expect(parent.querySelector('[data-id="0.0"]')?.textContent).toBe('keep')
    // Foreign nodes without data-id are left alone
    expect(parent.querySelector('.overlay')).not.toBeNull()
    // Sweep records removals and seals the state for miss reporting
    expect(hydration.sweptPaths).toEqual(['stale'])
    expect(hydration.claimedCount).toBe(2)
    expect(hydration.sealed).toBe(true)
  })

  test('sealed state short-circuits claims after the sweep', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<div data-id="0"></div>'
    const hydration = createHydrationState()
    sweepUnhydratedNodes(parent, hydration)
    // A matching node added later (dynamic work) is never claimed —
    // post-hydration rendering always builds fresh nodes.
    const late = document.createElement('div')
    late.setAttribute('data-id', '0.1')
    parent.appendChild(late)
    expect(claimHydratedChild(parent, '0.1', hydration)).toBeNull()
    expect(hydration.adopted.has(late)).toBe(false)
  })

  test('noteHydrationFallback records missing paths', () => {
    const hydration = createHydrationState()
    noteHydrationFallback(hydration, '0.1')
    noteHydrationFallback(hydration, '0.2')
    expect(hydration.createdPaths).toEqual(['0.1', '0.2'])
  })

  test('reportHydrationResult warns on misses, silent when clean', () => {
    const warnings: string[] = []
    const origWarn = console.warn
    console.warn = (...args: any[]) => {
      warnings.push(args.join(' '))
    }
    try {
      reportHydrationResult(createHydrationState())
      expect(warnings).toHaveLength(0)

      const skewed = createHydrationState()
      skewed.claimedCount = 3
      noteHydrationFallback(skewed, '0.1')
      skewed.sweptPaths.push('0.5')
      reportHydrationResult(skewed)
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('adopted 3 SSR node(s)')
      expect(warnings[0]).toContain('0.1')
      expect(warnings[0]).toContain('0.5')
    } finally {
      console.warn = origWarn
    }
  })
})

describe('hydration (SSR resumability)', () => {
  test('runtime initial data-ids match the SSR contract', () => {
    const parentElement = document.createElement('div')
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items: ['a', 'b', 'c'] },
    })
    const ctx = baseCtx({
      name: 'RepeatPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'ul',
          children: ['row'],
          attrs: {},
          events: {},
        },
        row: {
          type: 'element',
          tag: 'li',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          children: ['label'],
          attrs: {},
          events: {},
        },
        label: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item'] },
        },
      },
    })
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
    // Same scheme the SSR stableIds test asserts for this structure.
    expect(dataIds(parentElement)).toEqual([
      '0',
      '0.0',
      '0.0.0',
      '0.0(1)',
      '0.0(1).0',
      '0.0(2)',
      '0.0(2).0',
    ])
  })

  test('it reuses SSR elements instead of rebuilding them', () => {
    const parentElement = document.createElement('div')
    // Markup as SSR would render it (see stableIds tests for the scheme).
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-type="text" data-node-id="title" data-id="0.0">hello</span>' +
      '<p data-node-id="para" data-id="0.1">static</p>' +
      '</div>'
    const ssrRoot = parentElement.querySelector('[data-id="0"]')!
    const ssrTitle = parentElement.querySelector('[data-id="0.0"]')!
    const ssrPara = parentElement.querySelector('[data-id="0.1"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'SimplePage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['title', 'para'],
          attrs: {},
          events: {},
        },
        title: { type: 'text', value: { type: 'value', value: 'hello' } },
        para: {
          type: 'element',
          tag: 'p',
          children: ['para-text'],
          attrs: {},
          events: {},
        },
        'para-text': {
          type: 'text',
          value: { type: 'value', value: 'static' },
        },
      },
    })
    const { nodes } = hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    expect(nodes.length).toBe(1)
    expect(nodes[0]).toBe(ssrRoot)
    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrTitle)
    expect(parentElement.querySelector('[data-id="0.1"]')).toBe(ssrPara)
    // No duplicates, no rebuild
    expect(parentElement.querySelectorAll('[data-id="0"]').length).toBe(1)
    expect(dataIds(parentElement)).toEqual(['0', '0.0', '0.1', '0.1.0'])
  })

  test('hydrated dynamic bindings stay reactive', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-type="text" data-node-id="label" data-id="0.0">before</span>' +
      '</div>'
    const dataSignal = signal<ComponentData>({
      Attributes: { label: 'before' },
    })
    const ctx = baseCtx({
      name: 'ReactivePage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['label'],
          attrs: {},
          events: {},
        },
        label: {
          type: 'text',
          value: { type: 'path', path: ['Attributes', 'label'] },
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })
    const label = parentElement.querySelector('[data-id="0.0"]')!
    expect(label.textContent).toBe('before')
    dataSignal.update((data) => ({
      ...data,
      Attributes: { label: 'after' },
    }))
    expect(label.textContent).toBe('after')
  })

  test('hydration attaches event listeners to adopted nodes', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0"><button data-node-id="btn" data-id="0.0">go</button></div>'
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'EventPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['btn'],
          attrs: {},
          events: {},
        },
        btn: {
          type: 'element',
          tag: 'button',
          children: [],
          attrs: {},
          events: {
            onClick: { trigger: 'click', actions: [] },
          },
        },
      },
    })
    const seen: string[] = []
    const origAdd = Element.prototype.addEventListener
    Element.prototype.addEventListener = function (
      type: string,
      ...rest: any[]
    ) {
      seen.push(`${(this as Element).getAttribute('data-id')}:${type}`)
      return (origAdd as any).call(this, type, ...rest)
    }
    try {
      hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })
    } finally {
      Element.prototype.addEventListener = origAdd
    }
    expect(seen).toContain('0.0:click')
  })

  test('hydrated repeats keep node identity across updates (resumability)', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<div data-node-id="row" data-id="0.0"><span data-node-type="text" data-node-id="label" data-id="0.0.0">A</span></div>' +
      '<div data-node-id="row" data-id="0.0(1)"><span data-node-type="text" data-node-id="label" data-id="0.0(1).0">B</span></div>' +
      '<div data-node-id="row" data-id="0.0(2)"><span data-node-type="text" data-node-id="label" data-id="0.0(2).0">C</span></div>' +
      '</div>'
    const itemA = { id: 'a', name: 'A' }
    const itemB = { id: 'b', name: 'B' }
    const itemC = { id: 'c', name: 'C' }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items: [itemA, itemB, itemC] },
    })
    const ctx = baseCtx({
      name: 'ListPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['row'],
          attrs: {},
          events: {},
        },
        row: {
          type: 'element',
          tag: 'div',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['label'],
          attrs: {},
          events: {},
        },
        label: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'name'] },
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(3)
    const elA = root.children[0]!
    const elB = root.children[1]!
    const elC = root.children[2]!
    expect(elA.textContent).toBe('A')

    // Shuffle: nodes must move, not rebuild
    dataSignal.update((data) => ({
      ...data,
      Variables: { items: [itemC, itemA, itemB] },
    }))
    expect(root.children.length).toBe(3)
    expect(root.children[0]).toBe(elC)
    expect(root.children[1]).toBe(elA)
    expect(root.children[2]).toBe(elB)
    expect(root.children[0].textContent).toBe('C')

    dataSignal.destroy()
    parentElement.remove()
  })

  test('hydrated conditionals toggle without rebuilding the parent', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0"><span data-node-id="maybe" data-id="0.0">shown</span></div>'
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { show: true },
    })
    const ctx = baseCtx({
      name: 'CondPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['maybe'],
          attrs: {},
          events: {},
        },
        maybe: {
          type: 'element',
          tag: 'span',
          condition: { type: 'path', path: ['Variables', 'show'] },
          children: ['maybe-text'],
          attrs: {},
          events: {},
        },
        'maybe-text': {
          type: 'text',
          value: { type: 'value', value: 'shown' },
        },
      },
    })
    const ssrNode = parentElement.querySelector('[data-id="0.0"]')!
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })
    // Adopted, not rebuilt
    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrNode)

    dataSignal.update((data) => ({
      ...data,
      Variables: { show: false },
    }))
    expect(parentElement.querySelector('[data-id="0.0"]')).toBeNull()

    dataSignal.update((data) => ({
      ...data,
      Variables: { show: true },
    }))
    const recreated = parentElement.querySelector('[data-id="0.0"]')
    expect(recreated).not.toBeNull()
    expect(recreated).not.toBe(ssrNode)

    dataSignal.destroy()
    parentElement.remove()
  })

  test('stale SSR nodes are removed and missing nodes are created (skew)', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-id="gone" data-id="0.5">stale</span>' +
      '<span data-node-type="text" data-node-id="kept" data-id="0.0">kept</span>' +
      '</div>'
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'SkewPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['kept', 'fresh'],
          attrs: {},
          events: {},
        },
        kept: { type: 'text', value: { type: 'value', value: 'kept' } },
        fresh: {
          type: 'element',
          tag: 'em',
          children: ['fresh-text'],
          attrs: {},
          events: {},
        },
        'fresh-text': {
          type: 'text',
          value: { type: 'value', value: 'new' },
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })
    // Stale SSR node swept
    expect(parentElement.querySelector('[data-id="0.5"]')).toBeNull()
    // Kept node adopted at its stable path
    expect(parentElement.querySelector('[data-id="0.0"]')?.textContent).toBe(
      'kept',
    )
    // Missing node created at its stable path, in order
    const fresh = parentElement.querySelector('[data-id="0.1"]')
    expect(fresh?.tagName).toBe('EM')
    // Unique ids overall
    const ids = dataIds(parentElement)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('tag mismatch at a stable path replaces the node', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0"><div data-node-id="box" data-id="0.0">x</div></div>'
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'MismatchPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['box'],
          attrs: {},
          events: {},
        },
        box: {
          type: 'element',
          tag: 'section',
          children: [],
          attrs: {},
          events: {},
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })
    const box = parentElement.querySelector('[data-id="0.0"]')!
    expect(box.tagName).toBe('SECTION')
    expect(parentElement.querySelectorAll('[data-id="0.0"]').length).toBe(1)
  })

  test('renderComponent hydrates a full page tree with slots', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-type="text" data-node-id="slotted" data-id="0.0[default]">one</span>' +
      '<span data-node-type="text" data-node-id="slotted" data-id="0.0[default]{1}">two</span>' +
      '</div>'
    const first = parentElement.querySelector('[data-id="0.0[default]"]')!
    const second = parentElement.querySelector('[data-id="0.0[default]{1}"]')!

    const layout = {
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
    }
    const page = {
      name: 'SlotPage',
      nodes: {
        root: {
          type: 'component',
          name: 'TwoSlots',
          attrs: {},
          events: {},
          children: ['slotted-a', 'slotted-b'],
        },
        'slotted-a': {
          type: 'element',
          tag: 'span',
          attrs: {},
          events: {},
          children: [],
        },
        'slotted-b': {
          type: 'element',
          tag: 'span',
          attrs: {},
          events: {},
          children: [],
        },
      },
    }
    // Slotted spans render the same static text SSR would have produced.
    ;(page.nodes as any)['slotted-a'].children = ['text-a']
    ;(page.nodes as any)['slotted-b'].children = ['text-b']
    ;(page.nodes as any)['text-a'] = {
      type: 'text',
      value: { type: 'value', value: 'one' },
    }
    ;(page.nodes as any)['text-b'] = {
      type: 'text',
      value: { type: 'value', value: 'two' },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const hydration = createHydrationState()
    const nodes = renderComponent({
      component: page as any,
      components: [layout] as any,
      dataSignal,
      apis: {},
      abortSignal: new AbortController().signal,
      onEvent: () => {},
      isRootComponent: true,
      formulaCache: {},
      path: '0',
      children: {},
      root: document,
      providers: {},
      stores: { theme: signal<string | null>(null) },
      package: undefined,
      parentElement,
      instance: {},
      toddle: { getCustomFormula: () => undefined } as any,
      env: { runtime: 'page' } as ToddleEnv,
      hydration,
    })
    sweepUnhydratedNodes(parentElement, hydration)

    expect(nodes.length).toBeGreaterThan(0)
    // Both slotted SSR nodes adopted (span elements reuse the spans; their
    // static text children are adopted too).
    expect(parentElement.querySelector('[data-id="0.0[default]"]')).toBe(first)
    expect(parentElement.querySelector('[data-id="0.0[default]{1}"]')).toBe(
      second,
    )
    const ids = dataIds(parentElement)
    expect(new Set(ids).size).toBe(ids.length)

    dataSignal.destroy()
    parentElement.remove()
  })

  test('namespaced elements (svg/math) adopt SSR child elements and replace raw text nodes', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<svg data-node-id="icon" data-id="0.0">' +
      '<path data-node-id="shape" data-id="0.0.0" d="M0 0h10v10z"></path>' +
      '<text data-node-id="label" data-id="0.0.1">old</text>' +
      '</svg>' +
      '</div>'
    const ssrSvg = parentElement.querySelector('[data-id="0.0"]')!
    const ssrPath = parentElement.querySelector('[data-id="0.0.0"]')!
    const ssrTextEl = parentElement.querySelector('[data-id="0.0.1"]')!
    const dataSignal = signal<ComponentData>({
      Attributes: { text: 'updated' },
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'SvgPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['icon'],
          attrs: {},
          events: {},
        },
        icon: {
          type: 'element',
          tag: 'svg',
          children: ['shape', 'label'],
          attrs: {},
          events: {},
        },
        shape: {
          type: 'element',
          tag: 'path',
          children: [],
          attrs: { d: { type: 'value', value: 'M0 0h10v10z' } },
          events: {},
        },
        label: {
          type: 'element',
          tag: 'text',
          children: ['raw-text'],
          attrs: {},
          events: {},
        },
        'raw-text': {
          type: 'text',
          value: { type: 'path', path: ['Attributes', 'text'] },
        },
      },
    })
    const { hydration } = hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    // Both the root svg and its child elements (<path>, <text>) are adopted with zero misses
    expect(hydration.createdPaths).toEqual([])
    expect(hydration.sweptPaths).toEqual([])
    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrSvg)
    expect(parentElement.querySelector('[data-id="0.0.0"]')).toBe(ssrPath)
    expect(parentElement.querySelector('[data-id="0.0.1"]')).toBe(ssrTextEl)
    expect(ssrTextEl.textContent).toBe('updated')

    dataSignal.update((d) => ({ ...d, Attributes: { text: 'reactive-svg' } }))
    expect(ssrTextEl.textContent).toBe('reactive-svg')
    dataSignal.destroy()
  })

  test('SSR conditional that evaluates to false on client is removed during hydration', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-id="server-only" data-id="0.0">server</span>' +
      '<span data-node-type="text" data-node-id="always" data-id="0.1">client</span>' +
      '</div>'
    const ssrAlways = parentElement.querySelector('[data-id="0.1"]')!
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { isServer: false },
    })
    const ctx = baseCtx({
      name: 'ClientHiddenCondPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['server-only', 'always'],
          attrs: {},
          events: {},
        },
        'server-only': {
          type: 'element',
          tag: 'span',
          condition: { type: 'path', path: ['Variables', 'isServer'] },
          children: [],
          attrs: {},
          events: {},
        },
        always: {
          type: 'text',
          value: { type: 'value', value: 'client' },
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0.0"]')).toBeNull()
    expect(parentElement.querySelector('[data-id="0.1"]')).toBe(ssrAlways)
    dataSignal.destroy()
  })

  test('ignores stale data-id/data-node-id/data-component in node.attrs during element creation and hydration', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-id="child" data-id="0.0">ok</span>' +
      '</div>'
    const ssrChild = parentElement.querySelector('[data-id="0.0"]')!
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'StaleAttrsPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['child'],
          attrs: {},
          events: {},
        },
        child: {
          type: 'element',
          tag: 'span',
          children: [],
          attrs: {
            'data-id': { type: 'value', value: 'wrong-id' },
            'data-node-id': { type: 'value', value: 'wrong-node-id' },
            'data-component': { type: 'value', value: 'wrong-component' },
          },
          events: {},
        },
      },
    })
    const { hydration } = hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    expect(hydration.createdPaths).toEqual([])
    expect(hydration.sweptPaths).toEqual([])
    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrChild)
    expect(ssrChild.getAttribute('data-id')).toBe('0.0')
    expect(ssrChild.getAttribute('data-node-id')).toBe('child')
    dataSignal.destroy()
  })

  test('<script> elements rendered by SSR are adopted during hydration without re-executing', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<script type="module" data-id="0.0" data-node-id="inline-script">window.__testScriptRan = true</script>' +
      '</div>'
    const ssrScript = parentElement.querySelector('[data-id="0.0"]')!
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'ScriptPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['inline-script'],
          attrs: {},
          events: {},
        },
        'inline-script': {
          type: 'element',
          tag: 'script',
          children: ['script-text'],
          attrs: { type: { type: 'value', value: 'module' } },
          events: {},
        },
        'script-text': {
          type: 'text',
          value: { type: 'value', value: 'window.__testScriptRan = true' },
        },
      },
    })
    const { hydration } = hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrScript)
    expect(hydration.createdPaths).toEqual([])
    expect(hydration.sweptPaths).toEqual([])
    dataSignal.destroy()
  })
})

describe('hydration list replacement', () => {
  test('hydrated list wholesale-replaced by client data keeps order', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    // SSR rendered A,B; client replaces with C,D,E (e.g. user-specific fetch)
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<section data-node-id="root" data-id="0.0"><div data-node-id="a" data-id="0.0.0"><span data-node-type="text" data-node-id="ta" data-id="0.0.0.0">A</span></div><img data-node-id="b" data-id="0.0.1" src="x" /></section>' +
      '<section data-node-id="root" data-id="0.0(1)"><div data-node-id="a" data-id="0.0(1).0"><span data-node-type="text" data-node-id="ta" data-id="0.0(1).0.0">B</span></div><img data-node-id="b" data-id="0.0(1).1" src="x" /></section>' +
      '</div>'
    const layout: any = {
      name: 'Layout',
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          children: ['a', 'b'],
          attrs: {},
          events: {},
        },
        a: {
          type: 'element',
          tag: 'div',
          children: ['ta'],
          attrs: {},
          events: {},
        },
        ta: {
          type: 'text',
          value: { type: 'path', path: ['Attributes', 'label'] },
        },
        b: {
          type: 'element',
          tag: 'img',
          children: [],
          attrs: { src: { type: 'value', value: 'x' } },
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
          name: 'Layout',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: [],
          attrs: {
            label: { type: 'path', path: ['ListItem', 'Item', 'label'] },
          },
          events: {},
        },
      },
    }
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [
          { id: 'c', label: 'C' },
          { id: 'd', label: 'D' },
          { id: 'e', label: 'E' },
        ],
      },
    })
    const ctx = baseCtx(page, { components: [layout] })
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
    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(3)
    expect([...root.children].map((c) => c.textContent)).toEqual([
      'C',
      'D',
      'E',
    ])
    for (const s of root.children) {
      expect(tags(s)).toEqual(['div', 'img'])
    }
    dataSignal.destroy()
    parentElement.remove()
  })
})
