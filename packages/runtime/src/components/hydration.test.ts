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
  reconcileHydratedChildren,
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
  test('claimHydratedChild compares tag case-insensitively and removes mismatched candidate', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<div data-id="0"></div><span data-id="0.0">x</span><p data-id="0.1">y</p>'
    const hydration = createHydrationState()
    expect(claimHydratedChild(parent, '0', hydration, 'DIV')).not.toBeNull()
    expect(claimHydratedChild(parent, '0.0', hydration, 'span')).not.toBeNull()
    // Mismatched tag removes the stale node and returns null
    expect(claimHydratedChild(parent, '0.1', hydration, 'div')).toBeNull()
    expect(parent.querySelector('[data-id="0.1"]')).toBeNull()
  })

  test('claimHydratedChild adopts once', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<div data-id="0"></div><span data-id="0.0">x</span>'
    const hydration = createHydrationState()
    const first = claimHydratedChild(parent, '0.0', hydration)!
    expect(first.tagName).toBe('SPAN')
    // Already adopted — second claim misses
    expect(claimHydratedChild(parent, '0.0', hydration)).toBeNull()
    const other = createHydrationState()
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
    // Sweep seals the state and clears references
    expect(hydration.sealed).toBe(true)
    expect(hydration.adopted.size).toBe(0)
  })

  test('sweepUnhydratedNodes recurses through unmarked wrappers (e.g. implicit tbody) while preserving them', () => {
    const table = document.createElement('table')
    table.innerHTML =
      '<tbody><tr data-id="0.0"><td data-id="0.0.0">stale</td></tr></tbody>'
    const hydration = createHydrationState()
    const freshRow = document.createElement('tr')
    freshRow.setAttribute('data-id', '0.0')
    hydration.adopted.add(freshRow)
    table.appendChild(freshRow)

    sweepUnhydratedNodes(table, hydration)
    expect(table.querySelector('tbody')).not.toBeNull()
    expect(table.querySelectorAll('[data-id="0.0"]').length).toBe(1)
    expect(table.querySelector('[data-id="0.0"]')).toBe(freshRow)
  })

  test('reconcileHydratedChildren preserves forward order when mixing fallback and adopted roots', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<div data-id="0.1">B</div>'
    const hydration = createHydrationState()
    const adoptedB = claimHydratedChild(parent, '0.1', hydration)!
    const clientOnlyA = document.createElement('div')
    clientOnlyA.setAttribute('data-id', '0.0')
    clientOnlyA.textContent = 'A'
    hydration.adopted.add(clientOnlyA)

    reconcileHydratedChildren(parent, [clientOnlyA, adoptedB], hydration)
    sweepUnhydratedNodes(parent, hydration)
    expect([...parent.children].map((c) => c.textContent)).toEqual(['A', 'B'])
    expect(parent.children[1]).toBe(adoptedB)
  })

  test('claimHydratedChild preserves per-parent cursor when descending into child elements', () => {
    const parent = document.createElement('ul')
    parent.innerHTML =
      '<li data-id="0.0"><span data-id="0.0.0">a</span></li>' +
      '<li data-id="0.0(1)"><span data-id="0.0(1).0">b</span></li>' +
      '<li data-id="0.0(2)"><span data-id="0.0(2).0">c</span></li>' +
      '<li data-id="0.0(3)"><span data-id="0.0(3).0">d</span></li>'
    const hydration = createHydrationState()
    let liAttrReads = 0
    const origGetAttr = Element.prototype.getAttribute
    Element.prototype.getAttribute = function (name: string) {
      if (this.tagName === 'LI' && name === 'data-id') {
        liAttrReads++
      }
      return origGetAttr.call(this, name)
    }
    try {
      for (const suffix of ['', '(1)', '(2)', '(3)']) {
        const li = claimHydratedChild(parent, `0.0${suffix}`, hydration, 'li')!
        expect(li).not.toBeNull()
        const span = claimHydratedChild(
          li,
          `0.0${suffix}.0`,
          hydration,
          'span',
        )!
        expect(span).not.toBeNull()
      }
    } finally {
      Element.prototype.getAttribute = origGetAttr
    }
    // Each <li> should be inspected exactly once (O(N), not O(N^2))
    expect(liAttrReads).toBe(4)
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
    hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    // Both the root svg and its child elements (<path>, <text>) are adopted
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
    hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrChild)
    expect(ssrChild.getAttribute('data-id')).toBe('0.0')
    expect(ssrChild.getAttribute('data-node-id')).toBe('child')
    dataSignal.destroy()
  })

  test('<script> elements omitted by SSR are created on the client during hydration', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML = '<div data-node-id="root" data-id="0"></div>'
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
    hydrate({
      ctx,
      dataSignal,
      parentElement,
      path: '0',
      id: 'root',
    })

    const createdScript = parentElement.querySelector('[data-id="0.0"]')
    expect(createdScript?.tagName).toBe('SCRIPT')
    expect(createdScript?.textContent).toBe('window.__testScriptRan = true')
    dataSignal.destroy()
  })

  test('fallback children before an adopted sibling are inserted in forward order', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0"><p data-node-id="para" data-id="0.2">kept</p></div>'
    const ssrRoot = parentElement.querySelector('[data-id="0"]')!
    const ssrPara = parentElement.querySelector('[data-id="0.2"]')!
    const insertedIds: Array<string | null> = []
    const origInsertBefore = ssrRoot.insertBefore.bind(ssrRoot)
    ssrRoot.insertBefore = (<T extends Node>(
      node: T,
      child: Node | null,
    ): T => {
      insertedIds.push(
        node instanceof Element ? node.getAttribute('data-id') : null,
      )
      return origInsertBefore(node, child)
    }) as typeof ssrRoot.insertBefore

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'ScriptOrderPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['script-1', 'script-2', 'para'],
          attrs: {},
          events: {},
        },
        'script-1': {
          type: 'element',
          tag: 'script',
          children: ['s1-text'],
          attrs: {},
          events: {},
        },
        's1-text': {
          type: 'text',
          value: { type: 'value', value: 'window.__step = 1' },
        },
        'script-2': {
          type: 'element',
          tag: 'script',
          children: ['s2-text'],
          attrs: {},
          events: {},
        },
        's2-text': {
          type: 'text',
          value: { type: 'value', value: 'window.__step = 2' },
        },
        para: {
          type: 'element',
          tag: 'p',
          children: [],
          attrs: {},
          events: {},
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(insertedIds).toEqual(['0.0', '0.1'])
    expect(ssrRoot.children[2]).toBe(ssrPara)
    dataSignal.destroy()
  })

  test('adopted <option> clears parser-stripped raw text before rebuilding text children', () => {
    const parentElement = document.createElement('div')
    // Browsers strip <span> wrappers inside <option>, leaving raw text "Foo".
    parentElement.innerHTML =
      '<select data-node-id="root" data-id="0"><option data-node-id="opt" data-id="0.0">Foo</option></select>'
    const ssrOption = parentElement.querySelector('[data-id="0.0"]')!
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'SelectPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'select',
          children: ['opt'],
          attrs: {},
          events: {},
        },
        opt: {
          type: 'element',
          tag: 'option',
          children: ['opt-text'],
          attrs: {},
          events: {},
        },
        'opt-text': {
          type: 'text',
          value: { type: 'value', value: 'Foo' },
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrOption)
    expect(ssrOption.textContent).toBe('Foo')
    dataSignal.destroy()
  })

  test('adopted <textarea> restores its static .value property and unconditional classes', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<textarea value="hello" data-node-id="ta" data-id="0.0"></textarea>' +
      '</div>'
    const ssrTextarea = parentElement.querySelector(
      '[data-id="0.0"]',
    ) as HTMLTextAreaElement
    // Simulate browser HTML parser behavior where <textarea value="hello"> does not populate .value
    ssrTextarea.value = ''

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'TextareaPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['ta'],
          attrs: {},
          events: {},
        },
        ta: {
          type: 'element',
          tag: 'textarea',
          children: [],
          attrs: { value: { type: 'value', value: 'hello' } },
          classes: { 'always-on': {} },
          events: {},
        },
      },
    })
    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(ssrTextarea.value).toBe('hello')
    expect(ssrTextarea.classList.contains('always-on')).toBe(true)
    dataSignal.destroy()
  })

  test('attrs.class merges with generated style and instance classes on fresh mount', () => {
    const parentElement = document.createElement('div')
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'ClassMergePage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: [],
          style: { color: 'red' },
          classes: { 'static-cls': {} },
          attrs: { class: { type: 'value', value: 'attr-cls' } },
          events: {},
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
      instance: { Page: 'root' },
    })
    const root = nodes[0] as HTMLElement
    expect(root.classList.contains('attr-cls')).toBe(true)
    expect(root.classList.contains('static-cls')).toBe(true)
    expect(root.classList.contains('Page:root')).toBe(true)
    expect(root.classList.length).toBe(5)
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

describe('hydration SSR/CSR inconsistencies and fallbacks', () => {
  test('creates missing elements at start, middle, and end while adopting existing siblings in order', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<span data-node-id="stale-before" data-id="0.9">stale-1</span>' +
      '<p data-node-id="second" data-id="0.1"><span data-node-type="text" data-node-id="second-txt" data-id="0.1.0">B</span></p>' +
      '<em data-node-id="fourth" data-id="0.3"><span data-node-type="text" data-node-id="fourth-txt" data-id="0.3.0">D</span></em>' +
      '<span data-node-id="stale-after" data-id="0.10">stale-2</span>' +
      '</div>'

    const ssrRoot = parentElement.querySelector('[data-id="0"]')!
    const ssrSecond = parentElement.querySelector('[data-id="0.1"]')!
    const ssrFourth = parentElement.querySelector('[data-id="0.3"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { dynamicC: 'C' },
    })
    const ctx = baseCtx({
      name: 'PartialSsrPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['first', 'second', 'third', 'fourth', 'fifth'],
          attrs: {},
          events: {},
        },
        first: {
          type: 'element',
          tag: 'header',
          children: ['first-txt'],
          attrs: { 'data-role': { type: 'value', value: 'hdr' } },
          classes: { 'hdr-cls': {} },
          events: {},
        },
        'first-txt': {
          type: 'text',
          value: { type: 'value', value: 'A' },
        },
        second: {
          type: 'element',
          tag: 'p',
          children: ['second-txt'],
          attrs: {},
          events: {},
        },
        'second-txt': {
          type: 'text',
          value: { type: 'value', value: 'B' },
        },
        third: {
          type: 'text',
          value: { type: 'path', path: ['Variables', 'dynamicC'] },
        },
        fourth: {
          type: 'element',
          tag: 'em',
          children: ['fourth-txt'],
          attrs: {},
          events: {},
        },
        'fourth-txt': {
          type: 'text',
          value: { type: 'value', value: 'D' },
        },
        fifth: {
          type: 'element',
          tag: 'footer',
          children: ['fifth-txt'],
          attrs: {},
          events: {},
        },
        'fifth-txt': {
          type: 'text',
          value: { type: 'value', value: 'E' },
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0"]')).toBe(ssrRoot)
    // Adopted siblings preserve identity
    expect(parentElement.querySelector('[data-id="0.1"]')).toBe(ssrSecond)
    expect(parentElement.querySelector('[data-id="0.3"]')).toBe(ssrFourth)
    // Stale nodes are swept
    expect(parentElement.querySelector('[data-id="0.9"]')).toBeNull()
    expect(parentElement.querySelector('[data-id="0.10"]')).toBeNull()

    // Fallback-created nodes exist in exact order with full attributes/classes
    const childIds = [...ssrRoot.children].map((c) => c.getAttribute('data-id'))
    expect(childIds).toEqual(['0.0', '0.1', '0.2', '0.3', '0.4'])
    expect([...ssrRoot.children].map((c) => c.textContent)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
    ])

    const createdHeader = ssrRoot.children[0] as HTMLElement
    expect(createdHeader.tagName).toBe('HEADER')
    expect(createdHeader.getAttribute('data-role')).toBe('hdr')
    expect(createdHeader.classList.contains('hdr-cls')).toBe(true)

    // Reactive fallback text node updates properly
    dataSignal.update((d) => ({ ...d, Variables: { dynamicC: 'C-updated' } }))
    expect(ssrRoot.children[2]?.textContent).toBe('C-updated')

    dataSignal.destroy()
  })

  test('fallback-creates a missing intermediate component subtree with slots and repeats without sweeping its descendants', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    // SSR rendered root and header (0.0), but missed 0.1 (the Card component subtree)
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<header data-node-id="hdr" data-id="0.0"><span data-node-type="text" data-node-id="hdr-txt" data-id="0.0.0">Title</span></header>' +
      '</div>'
    const ssrHeader = parentElement.querySelector('[data-id="0.0"]')!

    const cardComp: any = {
      name: 'Card',
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          children: ['card-list', 'card-slot'],
          attrs: {},
          events: {},
        },
        'card-list': {
          type: 'element',
          tag: 'ul',
          children: ['card-item'],
          attrs: {},
          events: {},
        },
        'card-item': {
          type: 'element',
          tag: 'li',
          repeat: { type: 'path', path: ['Attributes', 'tags'] },
          children: ['item-txt'],
          attrs: {},
          events: {},
        },
        'item-txt': {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item'] },
        },
        'card-slot': {
          type: 'slot',
          children: [],
        },
      },
    }

    const pageComp: any = {
      name: 'Page',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['hdr', 'card-inst'],
          attrs: {},
          events: {},
        },
        hdr: {
          type: 'element',
          tag: 'header',
          children: ['hdr-txt'],
          attrs: {},
          events: {},
        },
        'hdr-txt': {
          type: 'text',
          value: { type: 'value', value: 'Title' },
        },
        'card-inst': {
          type: 'component',
          name: 'Card',
          attrs: {
            tags: { type: 'path', path: ['Variables', 'tags'] },
          },
          children: ['slotted-footer'],
          events: {},
        },
        'slotted-footer': {
          type: 'element',
          tag: 'footer',
          children: ['footer-txt'],
          attrs: {},
          events: {},
        },
        'footer-txt': {
          type: 'text',
          value: { type: 'path', path: ['Variables', 'footerLabel'] },
        },
      },
    }

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        tags: ['t1', 't2'],
        footerLabel: 'Slotted Footer',
      },
    })
    const ctx = baseCtx(pageComp, { components: [cardComp] })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0.0"]')).toBe(ssrHeader)
    const cardSection = parentElement.querySelector('[data-id="0.1"]')
    expect(cardSection?.tagName).toBe('SECTION')

    const items = parentElement.querySelectorAll('li')
    expect([...items].map((li) => li.textContent)).toEqual(['t1', 't2'])

    const footer = parentElement.querySelector('footer')
    expect(footer?.textContent).toBe('Slotted Footer')

    // Reactivity works inside the fallback-created component and slot
    dataSignal.update((d) => ({
      ...d,
      Variables: {
        tags: ['t1', 't2', 't3'],
        footerLabel: 'Updated Footer',
      },
    }))
    expect(
      [...parentElement.querySelectorAll('li')].map((li) => li.textContent),
    ).toEqual(['t1', 't2', 't3'])
    expect(parentElement.querySelector('footer')?.textContent).toBe(
      'Updated Footer',
    )

    dataSignal.destroy()
    parentElement.remove()
  })

  test('adopted parent with only stale SSR children sweeps stale children and appends fallback children', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<div data-node-id="old-1" data-id="0.88">stale 1</div>' +
      '<div data-node-id="old-2" data-id="0.99">stale 2</div>' +
      '</div>'
    const ssrRoot = parentElement.querySelector('[data-id="0"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'AllStaleChildrenPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['a', 'b'],
          attrs: {},
          events: {},
        },
        a: {
          type: 'element',
          tag: 'span',
          children: ['a-txt'],
          attrs: {},
          events: {},
        },
        'a-txt': {
          type: 'text',
          value: { type: 'value', value: 'Fresh A' },
        },
        b: {
          type: 'element',
          tag: 'p',
          children: ['b-txt'],
          attrs: {},
          events: {},
        },
        'b-txt': {
          type: 'text',
          value: { type: 'value', value: 'Fresh B' },
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0"]')).toBe(ssrRoot)
    expect(parentElement.querySelector('[data-id="0.88"]')).toBeNull()
    expect(parentElement.querySelector('[data-id="0.99"]')).toBeNull()
    expect([...ssrRoot.children].map((c) => c.getAttribute('data-id'))).toEqual(
      ['0.0', '0.1'],
    )
    expect([...ssrRoot.children].map((c) => c.textContent)).toEqual([
      'Fresh A',
      'Fresh B',
    ])

    dataSignal.destroy()
  })

  test('tag mismatch on middle sibling with subtree replaces it in place while keeping surrounding adopted siblings', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<header data-node-id="first" data-id="0.0">Header</header>' +
      '<div data-node-id="middle" data-id="0.1"><span data-node-id="old-child" data-id="0.1.0">Old Subtree</span></div>' +
      '<footer data-node-id="last" data-id="0.2">Footer</footer>' +
      '</div>'
    const ssrHeader = parentElement.querySelector('[data-id="0.0"]')!
    const ssrMismatchedDiv = parentElement.querySelector('[data-id="0.1"]')!
    const ssrFooter = parentElement.querySelector('[data-id="0.2"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'MiddleTagMismatchPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['first', 'middle', 'last'],
          attrs: {},
          events: {},
        },
        first: {
          type: 'element',
          tag: 'header',
          children: [],
          attrs: {},
          events: {},
        },
        middle: {
          type: 'element',
          tag: 'article',
          children: ['mid-heading'],
          attrs: {},
          events: {},
        },
        'mid-heading': {
          type: 'element',
          tag: 'h2',
          children: ['mid-txt'],
          attrs: {},
          events: {},
        },
        'mid-txt': {
          type: 'text',
          value: { type: 'value', value: 'New Subtree' },
        },
        last: {
          type: 'element',
          tag: 'footer',
          children: [],
          attrs: {},
          events: {},
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(3)
    expect(root.children[0]).toBe(ssrHeader)
    expect(root.children[2]).toBe(ssrFooter)
    expect(root.children[1]).not.toBe(ssrMismatchedDiv)
    expect(root.children[1]?.tagName).toBe('ARTICLE')
    expect(root.children[1]?.querySelector('h2')?.textContent).toBe(
      'New Subtree',
    )

    dataSignal.destroy()
  })

  test('tag mismatch when SSR has a non-span element at a TextNodeModel path replaces it with a text span', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<div data-node-id="txt" data-id="0.0">Wrong Tag</div>' +
      '<p data-node-id="after" data-id="0.1">Kept</p>' +
      '</div>'
    const ssrAfter = parentElement.querySelector('[data-id="0.1"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'TextTagMismatchPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['txt', 'after'],
          attrs: {},
          events: {},
        },
        txt: {
          type: 'text',
          value: { type: 'value', value: 'Correct Text Span' },
        },
        after: {
          type: 'element',
          tag: 'p',
          children: [],
          attrs: {},
          events: {},
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const root = parentElement.querySelector('[data-id="0"]')!
    expect(root.children.length).toBe(2)
    expect(root.children[0]?.tagName).toBe('SPAN')
    expect(root.children[0]?.getAttribute('data-node-type')).toBe('text')
    expect(root.children[0]?.textContent).toBe('Correct Text Span')
    expect(root.children[1]).toBe(ssrAfter)

    dataSignal.destroy()
  })

  test('out-of-order SSR siblings are claimed via wrap-around scan and reordered to match CSR', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<div data-node-id="root" data-id="0">' +
      '<section data-node-id="c" data-id="0.2">Third</section>' +
      '<header data-node-id="a" data-id="0.0">First</header>' +
      '<main data-node-id="b" data-id="0.1">Second</main>' +
      '</div>'
    const ssrA = parentElement.querySelector('[data-id="0.0"]')!
    const ssrB = parentElement.querySelector('[data-id="0.1"]')!
    const ssrC = parentElement.querySelector('[data-id="0.2"]')!

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })
    const ctx = baseCtx({
      name: 'OutOfOrderSsrPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['a', 'b', 'c'],
          attrs: {},
          events: {},
        },
        a: {
          type: 'element',
          tag: 'header',
          children: [],
          attrs: {},
          events: {},
        },
        b: {
          type: 'element',
          tag: 'main',
          children: [],
          attrs: {},
          events: {},
        },
        c: {
          type: 'element',
          tag: 'section',
          children: [],
          attrs: {},
          events: {},
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const root = parentElement.querySelector('[data-id="0"]')!
    expect([...root.children]).toEqual([ssrA, ssrB, ssrC])

    dataSignal.destroy()
  })

  test('repeat count mismatch: CSR has more items than SSR (adopts existing and fallback-creates missing items)', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    // SSR rendered only 2 items, but CSR has 4 items initially
    parentElement.innerHTML =
      '<ul data-node-id="root" data-id="0">' +
      '<li data-node-id="item" data-id="0.0"><span data-node-type="text" data-node-id="txt" data-id="0.0.0">A</span></li>' +
      '<li data-node-id="item" data-id="0.0(1)"><span data-node-type="text" data-node-id="txt" data-id="0.0(1).0">B</span></li>' +
      '</ul>'
    const ssrLi0 = parentElement.querySelector('[data-id="0.0"]')!
    const ssrLi1 = parentElement.querySelector('[data-id="0.0(1)"]')!

    const items = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
      { id: 'd', label: 'D' },
    ]
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items },
    })
    const ctx = baseCtx({
      name: 'RepeatMoreOnCsrPage',
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
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['txt'],
          attrs: {},
          events: {},
        },
        txt: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'label'] },
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const ul = parentElement.querySelector('[data-id="0"]')!
    expect(ul.children.length).toBe(4)
    expect(ul.children[0]).toBe(ssrLi0)
    expect(ul.children[1]).toBe(ssrLi1)
    expect([...ul.children].map((c) => c.getAttribute('data-id'))).toEqual([
      '0.0',
      '0.0(1)',
      '0.0(2)',
      '0.0(3)',
    ])
    expect([...ul.children].map((c) => c.textContent)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ])

    const fallbackLi2 = ul.children[2]!
    const fallbackLi3 = ul.children[3]!

    // Reordering preserves both adopted and fallback-created item references
    dataSignal.update((d) => ({
      ...d,
      Variables: { items: [items[3]!, items[1]!, items[2]!, items[0]!] },
    }))
    expect([...ul.children]).toEqual([fallbackLi3, ssrLi1, fallbackLi2, ssrLi0])

    dataSignal.destroy()
    parentElement.remove()
  })

  test('repeat count mismatch: CSR has fewer items than SSR (adopts subset, sweeps extras, and adds new items cleanly)', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    // SSR rendered 4 items, CSR only has 2 items initially
    parentElement.innerHTML =
      '<ul data-node-id="root" data-id="0">' +
      '<li data-node-id="item" data-id="0.0"><span data-node-type="text" data-node-id="txt" data-id="0.0.0">A</span></li>' +
      '<li data-node-id="item" data-id="0.0(1)"><span data-node-type="text" data-node-id="txt" data-id="0.0(1).0">B</span></li>' +
      '<li data-node-id="item" data-id="0.0(2)"><span data-node-type="text" data-node-id="txt" data-id="0.0(2).0">C</span></li>' +
      '<li data-node-id="item" data-id="0.0(3)"><span data-node-type="text" data-node-id="txt" data-id="0.0(3).0">D</span></li>' +
      '</ul>'
    const ssrLi0 = parentElement.querySelector('[data-id="0.0"]')!
    const ssrLi1 = parentElement.querySelector('[data-id="0.0(1)"]')!

    const items = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]
    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items },
    })
    const ctx = baseCtx({
      name: 'RepeatFewerOnCsrPage',
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
          repeat: { type: 'path', path: ['Variables', 'items'] },
          repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          children: ['txt'],
          attrs: {},
          events: {},
        },
        txt: {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item', 'label'] },
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    const ul = parentElement.querySelector('[data-id="0"]')!
    expect(ul.children.length).toBe(2)
    expect(ul.children[0]).toBe(ssrLi0)
    expect(ul.children[1]).toBe(ssrLi1)
    expect(parentElement.querySelector('[data-id="0.0(2)"]')).toBeNull()
    expect(parentElement.querySelector('[data-id="0.0(3)"]')).toBeNull()

    // Appending a new item after hydration builds a fresh node at 0.0(2)
    dataSignal.update((d) => ({
      ...d,
      Variables: {
        items: [...items, { id: 'e', label: 'E' }],
      },
    }))
    expect(ul.children.length).toBe(3)
    expect([...ul.children].map((c) => c.textContent)).toEqual(['A', 'B', 'E'])

    dataSignal.destroy()
    parentElement.remove()
  })

  test('repeat count mismatch: SSR rendered 0 items vs CSR has items, and SSR had items vs CSR has 0 items', () => {
    // Case 1: SSR rendered empty <ul>, CSR has 2 items
    const parent1 = document.createElement('div')
    document.body.appendChild(parent1)
    parent1.innerHTML = '<ul data-node-id="root" data-id="0"></ul>'
    const ssrUl1 = parent1.querySelector('[data-id="0"]')!

    const listComp = {
      name: 'ZeroVsManyRepeatPage',
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
          repeat: { type: 'path', path: ['Variables', 'items'] },
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

    const sig1 = signal<ComponentData>({
      Attributes: {},
      Variables: { items: ['One', 'Two'] },
    })
    hydrate({
      ctx: baseCtx(listComp),
      dataSignal: sig1,
      parentElement: parent1,
      path: '0',
      id: 'root',
    })
    expect(parent1.querySelector('[data-id="0"]')).toBe(ssrUl1)
    expect([...ssrUl1.children].map((c) => c.textContent)).toEqual([
      'One',
      'Two',
    ])
    sig1.destroy()
    parent1.remove()

    // Case 2: SSR rendered 2 items, CSR has 0 items initially, then adds 2 items later
    const parent2 = document.createElement('div')
    document.body.appendChild(parent2)
    parent2.innerHTML =
      '<ul data-node-id="root" data-id="0">' +
      '<li data-node-id="item" data-id="0.0"><span data-node-type="text" data-node-id="txt" data-id="0.0.0">Old1</span></li>' +
      '<li data-node-id="item" data-id="0.0(1)"><span data-node-type="text" data-node-id="txt" data-id="0.0(1).0">Old2</span></li>' +
      '</ul>'
    const ssrUl2 = parent2.querySelector('[data-id="0"]')!

    const sig2 = signal<ComponentData>({
      Attributes: {},
      Variables: { items: [] },
    })
    hydrate({
      ctx: baseCtx(listComp),
      dataSignal: sig2,
      parentElement: parent2,
      path: '0',
      id: 'root',
    })
    expect(parent2.querySelector('[data-id="0"]')).toBe(ssrUl2)
    expect(ssrUl2.children.length).toBe(0)

    sig2.update((d) => ({ ...d, Variables: { items: ['New1', 'New2'] } }))
    expect([...ssrUl2.children].map((c) => c.textContent)).toEqual([
      'New1',
      'New2',
    ])
    sig2.destroy()
    parent2.remove()
  })

  test('dynamic attributes, conditional classes, and style variables reconcile SSR/CSR differences on adopted elements', () => {
    const parentElement = document.createElement('div')
    parentElement.innerHTML =
      '<button data-node-id="root" data-id="0" class="keep-cls ssr-active" disabled="true" data-state="ssr" style="--size: 10px;">Click</button>'
    const ssrBtn = parentElement.querySelector('[data-id="0"]') as HTMLElement

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        isSsr: false,
        isCsr: true,
        disabled: false,
        stateAttr: 'csr',
        size: 24,
      },
    })
    const ctx = baseCtx({
      name: 'AttrClassSkewPage',
      nodes: {
        root: {
          type: 'element',
          tag: 'button',
          children: [],
          classes: {
            'keep-cls': {},
            'ssr-active': {
              formula: { type: 'path', path: ['Variables', 'isSsr'] },
            },
            'csr-active': {
              formula: { type: 'path', path: ['Variables', 'isCsr'] },
            },
          },
          attrs: {
            disabled: { type: 'path', path: ['Variables', 'disabled'] },
            'data-state': { type: 'path', path: ['Variables', 'stateAttr'] },
          },
          'style-variables': [
            {
              name: 'size',
              formula: { type: 'path', path: ['Variables', 'size'] },
              unit: 'px',
            },
          ],
          events: {},
        },
      },
    })

    hydrate({ ctx, dataSignal, parentElement, path: '0', id: 'root' })

    expect(parentElement.querySelector('[data-id="0"]')).toBe(ssrBtn)
    expect(ssrBtn.classList.contains('keep-cls')).toBe(true)
    expect(ssrBtn.classList.contains('ssr-active')).toBe(false)
    expect(ssrBtn.classList.contains('csr-active')).toBe(true)
    expect(ssrBtn.hasAttribute('disabled')).toBe(false)
    expect(ssrBtn.getAttribute('data-state')).toBe('csr')
    expect(ssrBtn.style.getPropertyValue('--size')).toBe('24px')

    dataSignal.destroy()
  })
})
