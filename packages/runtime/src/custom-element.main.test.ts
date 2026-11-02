/* eslint-disable no-console */
import type { Component, Theme, Toddle } from '@nordcraft/core'
import { safeCustomElementName } from '@nordcraft/core'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { defineComponents, loadCorePlugins } from './custom-element.main'
import type { ToddleComponent } from './custom-element/ToddleComponent'
import './happydom'
import type { LocationSignal } from './types'

if (!HTMLElement.prototype.attachInternals) {
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    value: () => ({ shadowRoot: null }) as unknown as ElementInternals,
    configurable: true,
  })
}

const createToddleInstance = (
  project = 'ce-project',
): Toddle<LocationSignal, never> => {
  const legacyActions: Record<string, any> = {}
  const legacyFormulas: Record<string, any> = {}
  const argumentInputDataList: Record<string, any> = {}
  const toddle: Toddle<LocationSignal, never> = {
    isEqual: () => false,
    errors: [],
    project,
    branch: 'main',
    commit: 'test-commit',
    components: [],
    formulas: {},
    actions: {},
    registerAction: (name, handler) => {
      legacyActions[name] = handler
    },
    getAction: (name) => legacyActions[name],
    registerFormula: (name, handler, getArgumentInputData) => {
      legacyFormulas[name] = handler
      if (getArgumentInputData) {
        argumentInputDataList[name] = getArgumentInputData
      }
    },
    getFormula: (name) => legacyFormulas[name],
    getCustomAction: (name, packageName) =>
      toddle.actions[packageName ?? project]?.[name] ??
      toddle.actions[project]?.[name],
    getCustomFormula: (name, packageName) =>
      toddle.formulas[packageName ?? project]?.[name] ??
      toddle.formulas[project]?.[name],
    // eslint-disable-next-line max-params
    getArgumentInputData: (formulaName, args, argIndex, data) =>
      argumentInputDataList[formulaName]?.(args, argIndex, data) || data,
    data: {},
    locationSignal: null as any,
    eventLog: [],
    pageState: {} as any,
    env: {
      isServer: false,
      branchName: 'main',
      request: undefined,
      runtime: 'custom-element',
      logErrors: true,
    },
  }
  loadCorePlugins(toddle)
  return toddle
}

describe('custom-element.main', () => {
  beforeEach(() => {
    globalThis.IS_CUSTOM_ELEMENT = true
    globalThis.IS_PAGE = false
    globalThis.IS_PREVIEW = false
    document.body.innerHTML = ''
  })

  afterEach(() => {
    globalThis.IS_CUSTOM_ELEMENT = true
    globalThis.IS_PAGE = true
    globalThis.IS_PREVIEW = true
    document.body.innerHTML = ''
  })

  test('loadCorePlugins populates isEqual, standard formulas, and standard actions', () => {
    const toddle = createToddleInstance()
    expect(toddle.isEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
    expect(toddle.isEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false)
    expect(typeof toddle.getFormula('@toddle/concatenate')).toBe('function')
    expect(typeof toddle.getFormula('@toddle/map')).toBe('function')
    expect(typeof toddle.getAction('@toddle/saveToLocalStorage')).toBe(
      'function',
    )
    expect(typeof toddle.getAction('@toddle/sleep')).toBe('function')

    // Argument input data handler for higher-order formulas like @toddle/map
    const mappedInput = toddle.getArgumentInputData(
      '@toddle/map',
      [['x', 'y']],
      1,
      { Attributes: {}, Variables: {} } as any,
    )
    expect((mappedInput as any).Args).toEqual({
      item: 'x',
      index: 0,
    })
  })

  test('loadCorePlugins defaults to window.toddle when no argument is passed', () => {
    const toddle = createToddleInstance()
    toddle.isEqual = (() => false) as any
    window.toddle = toddle as any
    loadCorePlugins()
    expect(window.toddle.isEqual({ x: 1 }, { x: 1 })).toBe(true)
  })

  test('defineComponents registers web components and warns on duplicate definition', () => {
    const toddle = createToddleInstance()
    const comp: Component = {
      name: 'my-widget-dup',
      attributes: {
        userName: { name: 'userName', testValue: 'Alice' },
      },
      variables: {},
      apis: {},
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    const tag = safeCustomElementName(comp.name)
    defineComponents([comp.name], { components: [comp], themes: {} }, toddle)
    const ctor = customElements.get(tag) as typeof ToddleComponent & {
      observedAttributes: string[]
    }
    expect(ctor).toBeDefined()
    expect(ctor.observedAttributes).toEqual(['username'])

    const warnings: string[] = []
    const origWarn = console.warn
    console.warn = (...args: any[]) => warnings.push(args.join(' '))
    try {
      defineComponents([comp.name], { components: [comp], themes: {} }, toddle)
    } finally {
      console.warn = origWarn
    }
    expect(warnings).toContain(`Component ${tag} already defined`)
  })

  test('mounted custom element renders shadow DOM with styles, reactive attributes, variables, and events', () => {
    const toddle = createToddleInstance()
    ;(window as any).toddle = toddle
    const comp: Component = {
      name: 'ce-counter-card',
      attributes: {
        labelText: { name: 'labelText', testValue: 'Clicks' },
        stepSize: { name: 'stepSize', testValue: 1 },
        configObj: { name: 'configObj', testValue: null },
      },
      variables: {
        count: {
          initialValue: { type: 'value', value: 10 },
        },
      },
      events: [
        {
          name: 'count-changed',
          dummyEvent: 0,
        },
      ],
      apis: {},
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          style: { display: 'flex' },
          classes: {
            'card-shell': {},
            'is-high': {
              formula: {
                type: 'function',
                name: '@toddle/greaterThan',
                arguments: [
                  {
                    name: 'First',
                    formula: { type: 'path', path: ['Variables', 'count'] },
                  },
                  {
                    name: 'Second',
                    formula: { type: 'value', value: 10 },
                  },
                ],
              },
            },
          },
          attrs: {},
          events: {},
          children: ['title', 'value-text', 'inc-btn'],
        },
        title: {
          type: 'text',
          value: { type: 'path', path: ['Attributes', 'labelText'] },
        },
        'value-text': {
          type: 'text',
          value: { type: 'path', path: ['Variables', 'count'] },
        },
        'inc-btn': {
          type: 'element',
          tag: 'button',
          attrs: {},
          children: [],
          events: {
            click: {
              trigger: 'click',
              actions: [
                {
                  type: 'SetVariable',
                  variable: 'count',
                  data: {
                    type: 'function',
                    name: '@toddle/add',
                    arguments: [
                      {
                        name: '0',
                        formula: { type: 'path', path: ['Variables', 'count'] },
                      },
                      {
                        name: '1',
                        formula: {
                          type: 'path',
                          path: ['Attributes', 'stepSize'],
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'TriggerEvent',
                  event: 'count-changed',
                  data: { type: 'path', path: ['Variables', 'count'] },
                },
              ],
            },
          },
        },
      },
    } as unknown as Component

    const tag = safeCustomElementName(comp.name)
    defineComponents([comp.name], { components: [comp], themes: {} }, toddle)

    const el = document.createElement(tag) as ToddleComponent
    document.body.appendChild(el)

    const shadow = el.shadowRoot!
    expect(shadow).not.toBeNull()
    expect(shadow.querySelector('style')).not.toBeNull()

    const rootDiv = shadow.querySelector('[data-id="0"]') as HTMLElement
    expect(rootDiv).not.toBeNull()
    expect(rootDiv.classList.contains('card-shell')).toBe(true)
    expect(rootDiv.classList.contains('is-high')).toBe(false)
    expect(rootDiv.getAttribute('data-is-root-component')).toBe('true')

    const titleSpan = shadow.querySelector('[data-id="0.0"]')!
    const countSpan = shadow.querySelector('[data-id="0.1"]')!
    const btn = shadow.querySelector('[data-id="0.2"]') as HTMLButtonElement

    expect(countSpan.textContent).toBe('10')

    // Update string and number attributes
    el.setAttribute('labelText', 'Score')
    el.setAttribute('stepSize', 5)
    el.setAttribute('configObj', { nested: true })

    expect(titleSpan.textContent).toBe('Score')
    expect(el.getAttribute('stepSize')).toBe(5)
    expect(el.getAttribute('configObj')).toEqual({ nested: true })

    // Trigger click event -> updates variable and dispatches CustomEvent
    const receivedEvents: any[] = []
    el.addEventListener('count-changed', (e) => {
      receivedEvents.push((e as CustomEvent).detail)
    })
    btn.click()

    expect(countSpan.textContent).toBe('15')
    expect(rootDiv.classList.contains('is-high')).toBe(true)
    expect(receivedEvents).toEqual([15])

    // Disconnecting destroys the signal and aborts the controller
    const abortSignal = el.__ctx.abortSignal
    expect(abortSignal.aborted).toBe(false)
    el.remove()
    expect(abortSignal.aborted).toBe(true)
  })

  test('custom element renders native <slot> at root and projects nested subcomponent slots', () => {
    const toddle = createToddleInstance()
    const innerBadge: Component = {
      name: 'ce-inner-badge',
      nodes: {
        root: {
          type: 'element',
          tag: 'span',
          attrs: { class: { type: 'value', value: 'badge' } },
          events: {},
          children: ['badge-slot'],
        },
        'badge-slot': {
          type: 'slot',
          name: 'default',
          children: [],
        },
      },
    } as unknown as Component

    const hostComp: Component = {
      name: 'ce-slot-host',
      nodes: {
        root: {
          type: 'element',
          tag: 'section',
          attrs: {},
          events: {},
          children: ['root-slot', 'nested-badge'],
        },
        'root-slot': {
          type: 'slot',
          name: 'header',
          children: ['fallback-text'],
        },
        'fallback-text': {
          type: 'text',
          value: { type: 'value', value: 'Default Header' },
        },
        'nested-badge': {
          type: 'component',
          name: 'ce-inner-badge',
          attrs: {},
          events: {},
          children: ['projected-text'],
        },
        'projected-text': {
          type: 'text',
          value: { type: 'value', value: 'Projected Badge' },
        },
      },
    } as unknown as Component

    const tag = safeCustomElementName(hostComp.name)
    defineComponents(
      [hostComp.name],
      { components: [hostComp, innerBadge], themes: {} },
      toddle,
    )

    const el = document.createElement(tag) as ToddleComponent
    document.body.appendChild(el)

    const shadow = el.shadowRoot!
    // Root slot is wrapped in a native <slot name="header"> element
    const nativeSlot = shadow.querySelector('slot[name="header"]')
    expect(nativeSlot).not.toBeNull()
    expect(nativeSlot?.textContent).toBe('Default Header')

    // Nested component slot is rendered directly (not a native <slot> since isRootComponent is false)
    const badge = shadow.querySelector('.badge')
    expect(badge).not.toBeNull()
    expect(badge?.querySelector('slot')).toBeNull()
    expect(badge?.textContent).toBe('Projected Badge')
  })

  test('custom element supports themes, context providers, and repeats', () => {
    const toddle = createToddleInstance()
    const consumer: Component = {
      name: 'ce-theme-consumer',
      contexts: {
        'ce-theme-provider': {
          formulas: ['activeTheme'],
          workflows: [],
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'p',
          attrs: {},
          events: {},
          children: ['txt'],
        },
        txt: {
          type: 'text',
          value: {
            type: 'path',
            path: ['Contexts', 'ce-theme-provider', 'activeTheme'],
          },
        },
      },
    } as unknown as Component

    const providerComp: Component = {
      name: 'ce-theme-provider',
      attributes: {
        themeName: { name: 'themeName', testValue: 'dark' },
      },
      variables: {
        items: {
          initialValue: { type: 'value', value: ['one', 'two'] },
        },
      },
      formulas: {
        activeTheme: {
          name: 'activeTheme',
          exposeInContext: true,
          formula: { type: 'path', path: ['Page', 'Theme'] },
        },
      },
      route: {
        path: [],
        query: {},
        info: {
          theme: {
            formula: { type: 'path', path: ['Attributes', 'themeName'] },
          },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: ['consumer-node', 'repeat-item'],
        },
        'consumer-node': {
          type: 'component',
          name: 'ce-theme-consumer',
          attrs: {},
          events: {},
          children: [],
        },
        'repeat-item': {
          type: 'element',
          tag: 'span',
          repeat: { type: 'path', path: ['Variables', 'items'] },
          attrs: {},
          events: {},
          children: ['item-txt'],
        },
        'item-txt': {
          type: 'text',
          value: { type: 'path', path: ['ListItem', 'Item'] },
        },
      },
    } as unknown as Component

    const customTheme: Theme = {
      fonts: [],
      propertyDefinitions: {},
    } as unknown as Theme

    const tag = safeCustomElementName(providerComp.name)
    defineComponents(
      [providerComp.name],
      {
        components: [providerComp, consumer],
        themes: { custom: customTheme },
      },
      toddle,
    )

    const el = document.createElement(tag) as ToddleComponent
    document.body.appendChild(el)

    // Initially themeName attribute is undefined
    expect(el.getAttribute('data-nc-theme')).toBeNull()

    // Setting themeName updates host attribute and propagates through Page.Theme -> Context -> consumer
    el.setAttribute('themeName', 'dark')
    expect(el.getAttribute('data-nc-theme')).toBe('dark')
    expect(el.shadowRoot!.querySelector('p')?.textContent).toBe('dark')

    // Clearing themeName to null removes data-nc-theme
    el.setAttribute('themeName', null)
    expect(el.getAttribute('data-nc-theme')).toBeNull()

    // Repeat items rendered inside custom element shadowRoot
    const spans = el.shadowRoot!.querySelectorAll(
      '[data-node-id="repeat-item"]',
    )
    expect([...spans].map((s) => s.textContent)).toEqual(['one', 'two'])
  })

  test('custom element root dynamic custom properties include :host selector and update reactively', () => {
    const toddle = createToddleInstance()
    const comp: Component = {
      name: 'ce-custom-props',
      attributes: {
        accentColor: { name: 'accentColor', testValue: 'blue' },
      },
      variables: {
        bgColor: {
          initialValue: { type: 'value', value: 'red' },
        },
      },
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: [],
          customProperties: {
            '--bg-color': {
              syntax: { type: 'primitive', name: 'color' },
              formula: { type: 'path', path: ['Variables', 'bgColor'] },
            },
          },
          'style-variables': [
            {
              name: 'accent',
              formula: { type: 'path', path: ['Attributes', 'accentColor'] },
              unit: undefined,
            },
          ],
        },
      },
    } as unknown as Component

    const tag = safeCustomElementName(comp.name)
    defineComponents([comp.name], { components: [comp], themes: {} }, toddle)

    const el = document.createElement(tag) as ToddleComponent
    el.setAttribute('accentColor', 'purple')
    document.body.appendChild(el)

    const rootDiv = el.shadowRoot!.querySelector('[data-id="0"]') as HTMLElement
    expect(rootDiv.style.getPropertyValue('--accent')).toBe('purple')
    expect(el.__component).toBe(comp)
    expect(el.__signal.get().Variables?.bgColor).toBe('red')
  })

  test('multiple independently defined custom elements with separate component lists resolve their own subcomponents when IS_PREVIEW is false', () => {
    const toddle1 = createToddleInstance('proj-1')
    const toddle2 = createToddleInstance('proj-2')

    const subA: Component = {
      name: 'ce-sub-a',
      nodes: {
        root: {
          type: 'element',
          tag: 'span',
          attrs: {},
          events: {},
          children: ['txt'],
        },
        txt: {
          type: 'text',
          value: { type: 'value', value: 'From Sub A' },
        },
      },
    } as unknown as Component

    const hostA: Component = {
      name: 'ce-multi-host-a',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: ['child-a'],
        },
        'child-a': {
          type: 'component',
          name: 'ce-sub-a',
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    const subB: Component = {
      name: 'ce-sub-b',
      nodes: {
        root: {
          type: 'element',
          tag: 'span',
          attrs: {},
          events: {},
          children: ['txt'],
        },
        txt: {
          type: 'text',
          value: { type: 'value', value: 'From Sub B' },
        },
      },
    } as unknown as Component

    const hostB: Component = {
      name: 'ce-multi-host-b',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          events: {},
          children: ['child-b'],
        },
        'child-b': {
          type: 'component',
          name: 'ce-sub-b',
          attrs: {},
          events: {},
          children: [],
        },
      },
    } as unknown as Component

    defineComponents(
      [hostA.name],
      { components: [hostA, subA], themes: {} },
      toddle1,
    )
    defineComponents(
      [hostB.name],
      { components: [hostB, subB], themes: {} },
      toddle2,
    )

    const elA = document.createElement(safeCustomElementName(hostA.name))
    const elB = document.createElement(safeCustomElementName(hostB.name))
    document.body.appendChild(elA)
    document.body.appendChild(elB)

    expect(elA.shadowRoot?.textContent).toContain('From Sub A')
    expect(elB.shadowRoot?.textContent).toContain('From Sub B')
  })
})
