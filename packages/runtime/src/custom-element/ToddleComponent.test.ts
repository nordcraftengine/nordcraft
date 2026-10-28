import type { Component, Toddle } from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import type { LocationSignal } from '../types'
import { ToddleComponent } from './ToddleComponent'

// happy-dom does not implement ElementInternals/attachInternals, so stub it out.
// The constructor falls back to attachShadow when internals.shadowRoot is unset.
if (!HTMLElement.prototype.attachInternals) {
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    value: () => ({ shadowRoot: null }) as unknown as ElementInternals,
    configurable: true,
  })
}

const component = {
  name: 'TestComponent',
  variables: {},
  attributes: {
    // camelCased keys, as in the editor
    myAttr: {} as never,
    myOtherAttr: {} as never,
  },
  apis: {},
} as unknown as Component

const toddle = { branch: 'main' } as unknown as Toddle<LocationSignal, never>

const defineAndCreate = () => {
  const tag = 'test-toddle-attr'
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends ToddleComponent {
        constructor() {
          super(component, { components: [component], themes: {} }, toddle)
        }

        static get observedAttributes() {
          return Object.keys(component.attributes ?? {}).map((key) =>
            key.toLowerCase(),
          )
        }
      },
    )
  }
  return document.createElement(tag) as ToddleComponent
}

describe('ToddleComponent attributeChangedCallback()', () => {
  test('it sets the value on the underlying camelCased attribute', () => {
    const el = defineAndCreate()
    el.attributeChangedCallback('myattr', null as never, 'new value')
    expect(el.getAttribute('myAttr')).toBe('new value')
  })

  test('it matches attribute names case-insensitively', () => {
    const el = defineAndCreate()
    el.attributeChangedCallback('MYATTR', null as never, 'second value')
    expect(el.getAttribute('myAttr')).toBe('second value')
  })

  test('it updates only the targeted attribute', () => {
    const el = defineAndCreate()
    el.attributeChangedCallback('myattr', null as never, 'first value')
    el.attributeChangedCallback('myotherattr', null as never, 'other value')
    expect(el.getAttribute('myAttr')).toBe('first value')
    expect(el.getAttribute('myOtherAttr')).toBe('other value')
  })

  test('it throws for attributes that are not defined on the component', () => {
    const el = defineAndCreate()
    expect(() =>
      el.attributeChangedCallback('unknownattr', null as never, 'value'),
    ).toThrow(
      `Unable to find attribute unknownattr on component ${component.name}`,
    )
  })
})

describe('ToddleComponent theme lifecycle', () => {
  test('it restores cookie theme listener and refreshes theme on reconnect', () => {
    const listeners = new Set<(event: any) => void>()
    const originalCookieStoreDescriptor =
      Object.getOwnPropertyDescriptor(window, 'cookieStore') ??
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(window),
        'cookieStore',
      )
    Object.defineProperty(window, 'cookieStore', {
      value: {
        addEventListener: (type: string, fn: (event: any) => void) => {
          if (type === 'change') {
            listeners.add(fn)
          }
        },
        removeEventListener: (type: string, fn: (event: any) => void) => {
          if (type === 'change') {
            listeners.delete(fn)
          }
        },
      },
      configurable: true,
      writable: true,
    })

    let freshEl: ToddleComponent | undefined
    try {
      document.cookie = 'nc-theme=light'
      freshEl = defineAndCreate()
      expect(listeners.size).toBe(1)

      freshEl.connectedCallback()
      expect(freshEl.getAttribute('data-nc-theme')).toBe('light')
      expect(freshEl.__signal.get().Page?.Theme).toBe('light')

      freshEl.disconnectedCallback()
      expect(listeners.size).toBe(0)

      // Theme cookie changes while disconnected
      document.cookie = 'nc-theme=dark'
      freshEl.connectedCallback()
      expect(freshEl.getAttribute('data-nc-theme')).toBe('dark')
      expect(freshEl.__signal.get().Page?.Theme).toBe('dark')
      expect(listeners.size).toBe(1)

      // Theme cookie changes while reconnected via cookieStore event
      for (const listener of listeners) {
        listener({
          changed: [{ name: 'nc-theme', value: 'contrast' }],
          deleted: [],
        })
      }
      expect(freshEl.getAttribute('data-nc-theme')).toBe('contrast')
      expect(freshEl.__signal.get().Page?.Theme).toBe('contrast')
    } finally {
      freshEl?.disconnectedCallback()
      if (originalCookieStoreDescriptor) {
        Object.defineProperty(
          window,
          'cookieStore',
          originalCookieStoreDescriptor,
        )
      } else {
        delete (window as any).cookieStore
      }
      document.cookie = 'nc-theme=; Max-Age=0'
    }
  })
})
