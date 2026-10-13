import { DATA_ATTR_SELECTED } from '../const'
import { getDOMNodeFromNodeId, stripNodeIdRepeatIndices } from '../dom'
import {
  centerGhostOnCursor,
  dragInsertEnded,
  dragInsertMove,
  dragInsertStarted,
  dropStylePropsOf,
} from '../helpers'
import { postMessageToEditor } from '../postMessageToEditor'
import type { CanvasElementType, DragInsertState } from '../types'

export const handleInsertStarted = (
  messageData: { x: number; y: number },
  highlightedNodeId: string | null,
  elementType: CanvasElementType,
): DragInsertState | null => {
  const highlightedElement =
    getDOMNodeFromNodeId(highlightedNodeId) ?? document.getElementById('App')
  if (!highlightedElement?.parentElement) {
    return null
  }
  const repeatedNodes = Array.from(highlightedElement.children).filter(
    (node) =>
      node instanceof HTMLElement &&
      node.getAttribute('data-id')?.startsWith(highlightedNodeId + '('),
  ) as HTMLElement[]

  const divElement = document.createElement('div')
  divElement.setAttribute(DATA_ATTR_SELECTED, 'true')
  divElement.style.minWidth = '1em'
  divElement.style.minHeight = '1em'

  const textElement = document.createElement('span')
  textElement.textContent = 'Text'

  const insertState = dragInsertStarted({
    action: 'insert',
    element: elementType === 'div' ? divElement : textElement,
    initialContainer: highlightedElement as HTMLElement,
    lastCursorPosition: { x: messageData.x, y: messageData.y },
    repeatedNodes,
    asCopy: false,
  })

  dragInsertMove('insert', insertState, [insertState.element])
  centerGhostOnCursor(insertState)

  return insertState
}

export const handleInsertMouseMove = (
  messageData: { x: number; y: number },
  insertState: DragInsertState,
) => {
  const { x, y } = messageData
  insertState.lastCursorPosition = { x, y }

  dragInsertMove('insert', insertState, [insertState.element])
  insertState.element.style.setProperty(
    'translate',
    `${x - insertState.offset.x}px ${y - insertState.offset.y}px`,
  )
}

export const handleInsertEnded = async (
  messageData: { canceled?: boolean },
  insertState: DragInsertState,
) => {
  const selectedPermutation =
    insertState.insertAreas?.[insertState.selectedInsertAreaIndex ?? -1]
  const styleProps = dropStylePropsOf(selectedPermutation)
  if (selectedPermutation && !messageData.canceled) {
    await dragInsertEnded(insertState, false)

    const parentDataId = selectedPermutation.parent.getAttribute('data-id')
    postMessageToEditor({
      type: 'insertNode',
      parent: parentDataId,
      index: selectedPermutation.index,
      slot: selectedPermutation.slot,
      ...styleProps,
    })

    const selectedNodeId =
      parentDataId !== null
        ? `${parentDataId}.${selectedPermutation.index}${
            selectedPermutation.slot ? `[${selectedPermutation.slot}]` : ''
          }`
        : `${selectedPermutation.index}`

    postMessageToEditor({
      type: 'selection',
      selectedNodeId: stripNodeIdRepeatIndices(selectedNodeId),
    })

    return null
  } else {
    await dragInsertEnded(insertState, true, { instant: true })
    return null
  }
}
