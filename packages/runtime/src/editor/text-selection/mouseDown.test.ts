import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { PointerState, SelectionState } from '../types'
import { handleTextMouseDown } from './mouseDown'

describe('handleTextMouseDown', () => {
  let node: HTMLSpanElement
  let pointerState: PointerState
  let selectionState: SelectionState

  beforeEach(() => {
    node = document.createElement('span')
    node.setAttribute('data-node-type', 'text')
    node.setAttribute('data-id', 'test-id')
    node.textContent = 'Hello World'
    document.body.appendChild(node)

    pointerState = {
      lastPressTime: 0,
      lastPressPosition: { x: 0, y: 0 },
      pressCount: 0,
      buttons: 0,
    }

    selectionState = {
      anchor: null,
      mode: 'char',
    }

    // happy-dom does not implement caretPositionFromPoint
    ;(document as unknown as Record<string, unknown>).caretPositionFromPoint = (
      _x: number,
      _y: number,
    ) => null
  })

  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)
      .caretPositionFromPoint
    node.remove()
    document.body.innerHTML = ''
  })

  test('calls handleTextNodeSelection, focuses, and selects all text when node is not yet contenteditable', () => {
    expect(node.getAttribute('contenteditable')).toBeNull()

    handleTextMouseDown({
      node,
      x: 10,
      y: 10,
      pointerState,
      selectionState,
    })

    expect(node.getAttribute('contenteditable')).toBe('plaintext-only')
    expect(document.activeElement).toBe(node)
    expect(selectionState.mode).toBe('all')
    expect(selectionState.anchor).toBeNull()

    const selection = window.getSelection()
    expect(selection).not.toBeNull()
    const range = selection?.getRangeAt(0)
    expect(range?.startContainer).toBe(node)
    expect(range?.startOffset).toBe(0)
    expect(range?.endContainer).toBe(node)
    expect(range?.endOffset).toBe(node.childNodes.length)
  })
})
