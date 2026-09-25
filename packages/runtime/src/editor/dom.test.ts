import type { Component } from '@nordcraft/core/dist/component/component.types'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { handleCanvasPointerEvent } from './canvasClick'
import { markHighlightedTextNode, NC_EDITOR_HIGHLIGHTED_CLASS } from './dom'

describe('markHighlightedTextNode', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="App">
        <span data-id="0.1" data-node-type="text">Hello Text</span>
        <div data-id="0.2">Div Element</div>
        <button data-id="0.3">Button Element</button>
        <span data-id="0.4" data-node-type="text">Another Text</span>
      </div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('gives the span class nc-editor-highlighted when a text node is highlighted and not selected', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: null,
    })

    const textSpan = document.querySelector('[data-id="0.1"]')
    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(true)
  })

  test('does not give class nc-editor-highlighted when the text node is selected', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: '0.1',
    })

    const textSpan = document.querySelector('[data-id="0.1"]')
    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
  })

  test('does not give class nc-editor-highlighted when the text node has data-selected="true"', () => {
    const textSpan = document.querySelector('[data-id="0.1"]')
    textSpan?.setAttribute('data-selected', 'true')

    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: null,
    })

    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
  })

  test('does not give class nc-editor-highlighted to non-text element types (div, button)', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.2',
      selectedNodeId: null,
    })

    const divElem = document.querySelector('[data-id="0.2"]')
    expect(divElem?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(false)

    markHighlightedTextNode({
      highlightedNodeId: '0.3',
      selectedNodeId: null,
    })

    const buttonElem = document.querySelector('[data-id="0.3"]')
    expect(buttonElem?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
  })

  test('removes nc-editor-highlighted from previous text node when a new node is highlighted', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: null,
    })

    const textSpan1 = document.querySelector('[data-id="0.1"]')
    expect(textSpan1?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      true,
    )

    markHighlightedTextNode({
      highlightedNodeId: '0.4',
      selectedNodeId: null,
    })

    const textSpan2 = document.querySelector('[data-id="0.4"]')
    expect(textSpan1?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
    expect(textSpan2?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      true,
    )
  })

  test('removes nc-editor-highlighted when highlightedNodeId is null', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: null,
    })

    const textSpan = document.querySelector('[data-id="0.1"]')
    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(true)

    markHighlightedTextNode({
      highlightedNodeId: null,
      selectedNodeId: null,
    })

    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
  })

  test('does not highlight text node when mode is test', () => {
    markHighlightedTextNode({
      highlightedNodeId: '0.1',
      selectedNodeId: null,
      mode: 'test',
    })

    const textSpan = document.querySelector('[data-id="0.1"]')
    expect(textSpan?.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(
      false,
    )
  })
})

describe('handleCanvasPointerEvent hover highlighting', () => {
  const mockComponent: Component = {
    name: 'test-comp',
    nodes: {
      root: {
        type: 'element',
        tag: 'div',
        children: ['text1', 'div1'],
      },
      text1: {
        type: 'text',
        value: { type: 'value', value: 'Hello' },
      },
      div1: {
        type: 'element',
        tag: 'div',
      },
    },
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="App">
        <span data-id="0.0" data-node-type="text">Hello</span>
        <div data-id="0.1">World</div>
      </div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('highlights text node on hover when not selected', () => {
    const textSpan = document.querySelector('[data-id="0.0"]')!
    document.elementsFromPoint = () => [textSpan]

    let highlighted: string | null = null
    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'mousemove' },
      mode: 'design',
      component: mockComponent,
      selectedNodeId: null,
      highlightedNodeId: null,
      metaKey: false,
      onHighlight: (id) => {
        highlighted = id
        markHighlightedTextNode({
          highlightedNodeId: id,
          selectedNodeId: null,
        })
      },
    })

    expect<string | null>(highlighted).toBe('0.0')
    expect(textSpan.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(true)
  })

  test('removes nc-editor-highlighted from text node when hovering over another element', () => {
    const textSpan = document.querySelector('[data-id="0.0"]')!
    const divElem = document.querySelector('[data-id="0.1"]')!

    // 1. Hover text node
    document.elementsFromPoint = () => [textSpan]
    let currentHighlighted: string | null = null
    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'mousemove' },
      mode: 'design',
      component: mockComponent,
      selectedNodeId: null,
      highlightedNodeId: currentHighlighted,
      metaKey: false,
      onHighlight: (id) => {
        currentHighlighted = id
        markHighlightedTextNode({
          highlightedNodeId: id,
          selectedNodeId: null,
        })
      },
    })

    expect(textSpan.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(true)

    // 2. Hover div element
    document.elementsFromPoint = () => [divElem]
    handleCanvasPointerEvent({
      event: { x: 50, y: 50, type: 'mousemove' },
      mode: 'design',
      component: mockComponent,
      selectedNodeId: null,
      highlightedNodeId: currentHighlighted,
      metaKey: false,
      onHighlight: (id) => {
        currentHighlighted = id
        markHighlightedTextNode({
          highlightedNodeId: id,
          selectedNodeId: null,
        })
      },
    })

    expect<string | null>(currentHighlighted).toBe('0.1')
    expect(textSpan.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(false)
    expect(divElem.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(false)
  })

  test('does not highlight text node on hover when it is already selected', () => {
    const textSpan = document.querySelector('[data-id="0.0"]')!
    document.elementsFromPoint = () => [textSpan]

    let highlightCalled = false
    handleCanvasPointerEvent({
      event: { x: 10, y: 10, type: 'mousemove' },
      mode: 'design',
      component: mockComponent,
      selectedNodeId: '0.0',
      highlightedNodeId: null,
      metaKey: false,
      onHighlight: (id) => {
        highlightCalled = true
        markHighlightedTextNode({
          highlightedNodeId: id,
          selectedNodeId: '0.0',
        })
      },
    })

    expect(highlightCalled).toBe(false)
    expect(textSpan.classList.contains(NC_EDITOR_HIGHLIGHTED_CLASS)).toBe(false)
  })

  test('sends repeatNodeIndex when hovering and clicking repeat elements', () => {
    const repeatComponent: Component = {
      name: 'repeat-comp',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          children: ['repeatItem'],
        },
        repeatItem: {
          type: 'element',
          tag: 'div',
          repeat: { type: 'value', value: [1, 2, 3] },
        },
      },
    }

    document.body.innerHTML = `
      <div id="App">
        <div data-id="0.0">Item 0</div>
        <div data-id="0.0(1)">Item 1</div>
        <div data-id="0.0(2)">Item 2</div>
      </div>
    `

    const item1 = document.querySelector('[data-id="0.0(1)"]')!
    const item0 = document.querySelector('[data-id="0.0"]')!

    const postedMessages: any[] = []
    const originalPostMessage = window.parent.postMessage
    window.parent.postMessage = (msg: any) => {
      postedMessages.push(msg)
    }

    try {
      // 1. Hover item 1 (0.0(1))
      document.elementsFromPoint = () => [item1]
      handleCanvasPointerEvent({
        event: { x: 10, y: 10, type: 'mousemove' },
        mode: 'design',
        component: repeatComponent,
        selectedNodeId: null,
        highlightedNodeId: null,
        metaKey: false,
      })

      const highlightMsg1 = postedMessages.find((m) => m.type === 'highlight')
      expect(highlightMsg1).toBeDefined()
      expect(highlightMsg1.highlightedNodeId).toBe('0.0')
      expect(highlightMsg1.exactHighlightedNodeId).toBe('0.0(1)')
      expect(highlightMsg1.repeatNodeIndex).toBe(1)

      // 2. Click item 1 (0.0(1))
      handleCanvasPointerEvent({
        event: { x: 10, y: 10, type: 'click' },
        mode: 'design',
        component: repeatComponent,
        selectedNodeId: null,
        highlightedNodeId: '0.0',
        metaKey: false,
      })

      const selectMsg1 = postedMessages.find((m) => m.type === 'selection')
      expect(selectMsg1).toBeDefined()
      expect(selectMsg1.selectedNodeId).toBe('0.0')
      expect(selectMsg1.repeatNodeIndex).toBe(1)

      // 3. Hover item 0 (0.0)
      postedMessages.length = 0
      document.elementsFromPoint = () => [item0]
      handleCanvasPointerEvent({
        event: { x: 10, y: 10, type: 'mousemove' },
        mode: 'design',
        component: repeatComponent,
        selectedNodeId: null,
        highlightedNodeId: null,
        exactHighlightedNodeId: '0.0(1)',
        metaKey: false,
      })

      const highlightMsg0 = postedMessages.find((m) => m.type === 'highlight')
      expect(highlightMsg0).toBeDefined()
      expect(highlightMsg0.highlightedNodeId).toBe('0.0')
      expect(highlightMsg0.exactHighlightedNodeId).toBe('0.0')
      expect(highlightMsg0.repeatNodeIndex).toBe(0)

      // 4. Click item 0 (0.0)
      handleCanvasPointerEvent({
        event: { x: 10, y: 10, type: 'click' },
        mode: 'design',
        component: repeatComponent,
        selectedNodeId: null,
        highlightedNodeId: '0.0',
        metaKey: false,
      })

      const selectMsg0 = postedMessages.find((m) => m.type === 'selection')
      expect(selectMsg0).toBeDefined()
      expect(selectMsg0.selectedNodeId).toBe('0.0')
      expect(selectMsg0.repeatNodeIndex).toBe(0)
    } finally {
      window.parent.postMessage = originalPostMessage
    }
  })
})
