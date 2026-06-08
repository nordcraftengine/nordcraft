import type { SelectionAnchor, SelectionMode } from './types'

export interface MouseMoveResult {
  selectionAnchor: SelectionAnchor | null
  selectionMode: SelectionMode
  handled: boolean
}

export const handleTextMouseMove = ({
  node,
  x,
  y,
  buttons,
  prevButtons,
  selectionAnchor,
  selectionMode,
}: {
  node: HTMLElement
  x: number
  y: number
  buttons: number
  prevButtons: number
  selectionAnchor: SelectionAnchor | null
  selectionMode: SelectionMode
}): MouseMoveResult => {
  const primaryPressed = (buttons & 1) === 1
  const primaryJustReleased = !primaryPressed && (prevButtons & 1) === 1

  if (primaryJustReleased) {
    return {
      selectionAnchor: null,
      selectionMode: 'char',
      handled: false,
    }
  }

  if (primaryPressed && selectionAnchor && selectionMode !== 'all') {
    const caretPosition = document.caretPositionFromPoint(x, y)
    const selection = window.getSelection()

    if (caretPosition && node.contains(caretPosition.offsetNode) && selection) {
      const {
        node: anchorNode,
        offset: anchorOffset,
        wordStart: anchorWordStart,
        wordEnd: anchorWordEnd,
      } = selectionAnchor
      const focusNode = caretPosition.offsetNode
      const focusOffset = caretPosition.offset

      const position = anchorNode.compareDocumentPosition(focusNode)
      const focusIsBeforeAnchor =
        !!(position & Node.DOCUMENT_POSITION_PRECEDING) ||
        (position === 0 && focusOffset < anchorOffset)

      selection.removeAllRanges()
      const range = document.createRange()

      if (selectionMode === 'word' && focusNode.nodeType === Node.TEXT_NODE) {
        // Extend selection word-by-word
        const text = focusNode.textContent ?? ''
        let focusWordStart = focusOffset
        let focusWordEnd = focusOffset
        while (focusWordStart > 0 && !/\s/.test(text[focusWordStart - 1]))
          focusWordStart--
        while (focusWordEnd < text.length && !/\s/.test(text[focusWordEnd]))
          focusWordEnd++

        if (focusIsBeforeAnchor) {
          // Dragging backwards: start from focus word start, end at anchor word end
          range.setStart(focusNode, focusWordStart)
          range.setEnd(anchorNode, anchorWordEnd ?? anchorOffset)
        } else {
          // Dragging forwards: start from anchor word start, end at focus word end
          range.setStart(anchorNode, anchorWordStart ?? anchorOffset)
          range.setEnd(focusNode, focusWordEnd)
        }
      } else {
        // Char mode — extend character by character
        if (focusIsBeforeAnchor) {
          range.setStart(focusNode, focusOffset)
          range.setEnd(anchorNode, anchorOffset)
        } else {
          range.setStart(anchorNode, anchorOffset)
          range.setEnd(focusNode, focusOffset)
        }
      }

      selection.addRange(range)
      node.focus()
      return {
        selectionAnchor,
        selectionMode,
        handled: true,
      }
    }
  }

  return {
    selectionAnchor,
    selectionMode,
    handled: false,
  }
}
