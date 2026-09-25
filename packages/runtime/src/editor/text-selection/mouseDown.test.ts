import { afterEach, beforeEach, describe } from 'bun:test'
import {
  DATA_ATTR_ID,
  DATA_ATTR_NODE_TYPE,
  DATA_NODE_TYPE_TEXT,
} from '../const'
import type { PointerState, SelectionState } from '../types'

describe('handleTextMouseDown', () => {
  let node: HTMLSpanElement
  let pointerState: PointerState
  let selectionState: SelectionState

  beforeEach(() => {
    node = document.createElement('span')
    node.setAttribute(DATA_ATTR_NODE_TYPE, DATA_NODE_TYPE_TEXT)
    node.setAttribute(DATA_ATTR_ID, 'test-id')
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
})
