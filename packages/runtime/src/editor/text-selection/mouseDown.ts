import type { PointerState, SelectionState } from '../types'
import { handleTextNodeSelection } from './selection'

const DOUBLE_CLICK_TIME_MAX = 500
const DOUBLE_CLICK_DISTANCE_MAX = 2

/**
 * Proxy handler for mousedown events on text nodes to manage selection state and communicate with the editor.
 * Handles single, double, and triple clicks for character, word, and full node selection respectively, similar to how standard text editors work.
 */
export const handleTextMouseDown = ({
  node,
  x,
  y,
  pointerState,
  selectionState,
}: {
  node: HTMLElement
  x: number
  y: number
  pointerState: PointerState
  selectionState: SelectionState
}): void => {
  const now = Date.now()
  const caretPosition = document.caretPositionFromPoint(x, y)

  const isDoubleDown =
    now - pointerState.lastPressTime < DOUBLE_CLICK_TIME_MAX &&
    Math.abs(x - pointerState.lastPressPosition.x) <=
      DOUBLE_CLICK_DISTANCE_MAX &&
    Math.abs(y - pointerState.lastPressPosition.y) <= DOUBLE_CLICK_DISTANCE_MAX

  const isTripleDown =
    isDoubleDown &&
    now - pointerState.lastPressTime < DOUBLE_CLICK_TIME_MAX &&
    pointerState.pressCount >= 2

  pointerState.lastPressTime = now
  pointerState.lastPressPosition.x = x
  pointerState.lastPressPosition.y = y
  pointerState.pressCount = isDoubleDown ? pointerState.pressCount + 1 : 1

  if (caretPosition && node.contains(caretPosition.offsetNode)) {
    const selection = window.getSelection()
    if (selection) {
      if (isTripleDown) {
        // Triple mousedown — select all text in the node
        selectionState.anchor = null
        selectionState.mode = 'all'
        selection.removeAllRanges()
        const range = document.createRange()
        range.selectNodeContents(node)
        selection.addRange(range)
      } else if (
        isDoubleDown &&
        caretPosition.offsetNode.nodeType === Node.TEXT_NODE
      ) {
        // Double mousedown — select word under cursor, anchor to word boundaries
        selectionState.mode = 'word'
        const text = caretPosition.offsetNode.textContent ?? ''
        const { offset } = caretPosition
        let start = offset
        while (start > 0 && !/\s/.test(text[start - 1])) start--
        let end = offset
        while (end < text.length && !/\s/.test(text[end])) end++

        // Anchor is the full word boundary so drag extends word-by-word
        selectionState.anchor = {
          node: caretPosition.offsetNode,
          wordStart: start,
          wordEnd: end > start ? end : start,
          offset: start,
        }

        selection.removeAllRanges()
        const range = document.createRange()
        range.setStart(caretPosition.offsetNode, start)
        range.setEnd(caretPosition.offsetNode, end > start ? end : start)
        selection.addRange(range)
      } else {
        // Single mousedown — place caret
        selectionState.mode = 'char'
        selectionState.anchor = {
          node: caretPosition.offsetNode,
          offset: caretPosition.offset,
          wordStart: caretPosition.offset,
          wordEnd: caretPosition.offset,
        }
        selection.removeAllRanges()
        const range = document.createRange()
        range.setStart(caretPosition.offsetNode, caretPosition.offset)
        range.collapse(true)
        selection.addRange(range)
      }
    }
  }

  window.focus()
  node.focus()
  if (node.getAttribute('contenteditable') !== 'plaintext-only') {
    handleTextNodeSelection(node)
  }
}
