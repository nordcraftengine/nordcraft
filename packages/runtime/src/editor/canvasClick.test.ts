import type { Component } from '@nordcraft/core'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getElementsFromPoint, handleCanvasPointerEvent } from './canvasClick'

const getEffectivePointerEvents = (el: Element): string => {
  let current: Element | null = el
  while (current) {
    const value = window.getComputedStyle(current).pointerEvents
    if (value && value !== 'inherit') {
      return value
    }
    current = current.parentElement
  }
  return 'auto'
}

const createBrowserLikeElementsFromPoint = (candidates: Element[]) => {
  return () =>
    candidates.filter((el) => getEffectivePointerEvents(el) !== 'none')
}

describe('getElementsFromPoint', () => {
  const originalElementsFromPoint = document.elementsFromPoint

  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.elementsFromPoint = originalElementsFromPoint
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  test('includes elements with stylesheet pointer-events: none and restores styles afterward', () => {
    const style = document.createElement('style')
    style.textContent = '.no-pointer { pointer-events: none; }'
    document.head.appendChild(style)

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" class="no-pointer">Blocked</div>
        <div data-id="0.1">Normal</div>
      </div>
    `

    const blocked = document.querySelector('[data-id="0.0"]')!
    const normal = document.querySelector('[data-id="0.1"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([
      blocked,
      normal,
    ])

    const result = getElementsFromPoint(10, 10)

    expect(result).toEqual([blocked, normal])
    expect(window.getComputedStyle(blocked).pointerEvents).toBe('none')
    expect(document.head.querySelectorAll('style').length).toBe(1)
  })

  test('includes elements with stylesheet pointer-events: none !important and restores styles afterward', () => {
    const style = document.createElement('style')
    style.textContent = '.no-pointer { pointer-events: none !important; }'
    document.head.appendChild(style)

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" class="no-pointer">Blocked Important</div>
      </div>
    `

    const blocked = document.querySelector('[data-id="0.0"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([blocked])

    const result = getElementsFromPoint(10, 10)

    expect(result).toEqual([blocked])
    expect(window.getComputedStyle(blocked).pointerEvents).toBe('none')
    expect(document.head.querySelectorAll('style').length).toBe(1)
  })

  test('includes elements with inline pointer-events: none and restores inline style afterward', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" style="pointer-events: none;">Inline Blocked</div>
      </div>
    `

    const blocked = document.querySelector<HTMLElement>('[data-id="0.0"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([blocked])

    const result = getElementsFromPoint(10, 10)

    expect(result).toEqual([blocked])
    expect(blocked.style.getPropertyValue('pointer-events')).toBe('none')
    expect(blocked.style.getPropertyPriority('pointer-events')).toBe('')
    expect(document.head.querySelectorAll('style').length).toBe(0)
  })

  test('includes elements with inline pointer-events: none !important and restores inline style and priority afterward', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" style="pointer-events: none !important;">Inline Important</div>
      </div>
    `

    const blocked = document.querySelector<HTMLElement>('[data-id="0.0"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([blocked])

    const result = getElementsFromPoint(10, 10)

    expect(result).toEqual([blocked])
    expect(blocked.style.getPropertyValue('pointer-events')).toBe('none')
    expect(blocked.style.getPropertyPriority('pointer-events')).toBe(
      'important',
    )
    expect(document.head.querySelectorAll('style').length).toBe(0)
  })

  test('includes child elements inheriting pointer-events: none from an ancestor', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" style="pointer-events: none;">
          <span data-id="0.0.0">Inherited</span>
        </div>
      </div>
    `

    const parent = document.querySelector<HTMLElement>('[data-id="0.0"]')!
    const child = document.querySelector<HTMLElement>('[data-id="0.0.0"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([
      child,
      parent,
    ])

    expect(getEffectivePointerEvents(child)).toBe('none')

    const result = getElementsFromPoint(10, 10)

    expect(result).toEqual([child, parent])
    expect(getEffectivePointerEvents(parent)).toBe('none')
    expect(getEffectivePointerEvents(child)).toBe('none')
  })

  test('cleans up temporary style and inline overrides even when elementsFromPoint throws', () => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" style="pointer-events: none !important;">Blocked</div>
      </div>
    `

    const blocked = document.querySelector<HTMLElement>('[data-id="0.0"]')!
    document.elementsFromPoint = () => {
      throw new Error('hit-test failed')
    }

    expect(() => getElementsFromPoint(10, 10)).toThrow('hit-test failed')
    expect(blocked.style.getPropertyValue('pointer-events')).toBe('none')
    expect(blocked.style.getPropertyPriority('pointer-events')).toBe(
      'important',
    )
    expect(document.head.querySelectorAll('style').length).toBe(0)
  })
})

describe('handleCanvasPointerEvent with pointer-events: none', () => {
  const originalElementsFromPoint = document.elementsFromPoint
  const originalPostMessage = window.parent.postMessage

  const component: Component = {
    name: 'pointer-events-comp',
    nodes: {
      root: {
        type: 'element',
        tag: 'div',
        children: ['overlay', 'background'],
      },
      overlay: {
        type: 'element',
        tag: 'div',
        style: {
          'pointer-events': 'none',
        },
        children: ['overlayText'],
      },
      overlayText: {
        type: 'text',
        value: { type: 'value', value: 'Overlay' },
      },
      background: {
        type: 'element',
        tag: 'div',
      },
    },
  }

  let postedMessages: unknown[] = []

  beforeEach(() => {
    postedMessages = []
    window.parent.postMessage = (msg: unknown) => {
      postedMessages.push(msg)
    }
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.elementsFromPoint = originalElementsFromPoint
    window.parent.postMessage = originalPostMessage
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  test('selects an element with pointer-events: none on click', () => {
    const style = document.createElement('style')
    style.textContent = '.overlay { pointer-events: none; }'
    document.head.appendChild(style)

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" class="overlay">
          <span data-id="0.0.0" data-node-type="text">Overlay</span>
        </div>
        <div data-id="0.1">Background</div>
      </div>
    `

    const overlay = document.querySelector('[data-id="0.0"]')!
    const background = document.querySelector('[data-id="0.1"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([
      overlay,
      background,
    ])

    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'click' },
      mode: 'design',
      component,
      selectedNodeId: null,
      highlightedNodeId: null,
      metaKey: false,
    })

    expect(postedMessages).toEqual([
      {
        type: 'selection',
        selectedNodeId: '0.0',
        repeatNodeIndex: null,
      },
    ])
  })

  test('highlights an element with pointer-events: none on mousemove', () => {
    const style = document.createElement('style')
    style.textContent = '.overlay { pointer-events: none; }'
    document.head.appendChild(style)

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" class="overlay"></div>
        <div data-id="0.1">Background</div>
      </div>
    `

    const overlay = document.querySelector('[data-id="0.0"]')!
    const background = document.querySelector('[data-id="0.1"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([
      overlay,
      background,
    ])

    let highlighted: string | null = null
    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'mousemove' },
      mode: 'design',
      component,
      selectedNodeId: null,
      highlightedNodeId: null,
      metaKey: false,
      onHighlight: (id) => {
        highlighted = id
      },
    })

    expect<string | null>(highlighted).toBe('0.0')
    expect(postedMessages).toEqual([
      {
        type: 'highlight',
        highlightedNodeId: '0.0',
        exactHighlightedNodeId: '0.0',
        repeatNodeIndex: null,
      },
    ])
  })

  test('does not highlight parent when hovering inside a selected text node with pointer-events: none', () => {
    const style = document.createElement('style')
    style.textContent = '.overlay { pointer-events: none; }'
    document.head.appendChild(style)

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0" class="overlay">
          <span data-id="0.0.0" data-node-type="text">Overlay</span>
        </div>
      </div>
    `

    const overlay = document.querySelector('[data-id="0.0"]')!
    const overlayText = document.querySelector('[data-id="0.0.0"]')!
    document.elementsFromPoint = createBrowserLikeElementsFromPoint([
      overlayText,
      overlay,
    ])

    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'mousemove' },
      mode: 'design',
      component,
      selectedNodeId: '0.0.0',
      highlightedNodeId: '0.1',
      metaKey: false,
    })

    expect(postedMessages).toEqual([
      {
        type: 'highlight',
        highlightedNodeId: null,
        exactHighlightedNodeId: null,
        repeatNodeIndex: null,
      },
    ])
  })
})
