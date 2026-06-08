import { handleTextNodeSelection } from './selection'
import type { SelectionAnchor, SelectionMode } from './types'

export interface MouseDownContext {
  lastMouseDownTime: number
  lastMouseDownX: number
  lastMouseDownY: number
  mouseDownCount: number
}

export interface MouseDownResult {
  selectionAnchor: SelectionAnchor | null
  selectionMode: SelectionMode
  context: MouseDownContext
}

export const handleTextMouseDown = ({
  node,
  x,
  y,
  context,
}: {
  node: HTMLElement
  x: number
  y: number
  context: MouseDownContext
}): MouseDownResult => {
  let { lastMouseDownTime, lastMouseDownX, lastMouseDownY, mouseDownCount } =
    context
  const now = Date.now()
  const caretPosition = document.caretPositionFromPoint(x, y)

  const isDoubleDown =
    now - lastMouseDownTime < 600 &&
    Math.abs(x - lastMouseDownX) < 10 &&
    Math.abs(y - lastMouseDownY) < 10

  const isTripleDown =
    isDoubleDown && now - lastMouseDownTime < 600 && mouseDownCount >= 2

  lastMouseDownTime = now
  lastMouseDownX = x
  lastMouseDownY = y
  mouseDownCount = isDoubleDown ? mouseDownCount + 1 : 1

  let selectionAnchor: SelectionAnchor | null = null
  let selectionMode: SelectionMode = 'char'

  if (caretPosition && node.contains(caretPosition.offsetNode)) {
    const selection = window.getSelection()
    if (selection) {
      if (isTripleDown) {
        // Triple mousedown — select all text in the node
        selectionAnchor = null
        selectionMode = 'all'
        selection.removeAllRanges()
        const range = document.createRange()
        range.selectNodeContents(node)
        selection.addRange(range)
      } else if (
        isDoubleDown &&
        caretPosition.offsetNode.nodeType === Node.TEXT_NODE
      ) {
        // Double mousedown — select word under cursor, anchor to word boundaries
        selectionMode = 'word'
        const text = caretPosition.offsetNode.textContent ?? ''
        const { offset } = caretPosition
        let start = offset
        while (start > 0 && !/\s/.test(text[start - 1])) start--
        let end = offset
        while (end < text.length && !/\s/.test(text[end])) end++

        // Anchor is the full word boundary so drag extends word-by-word
        selectionAnchor = {
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
        selectionMode = 'char'
        selectionAnchor = {
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

  return {
    selectionAnchor,
    selectionMode,
    context: {
      lastMouseDownTime,
      lastMouseDownX,
      lastMouseDownY,
      mouseDownCount,
    },
  }
}
