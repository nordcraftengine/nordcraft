import { getDOMNodeFromNodeId } from '../../editor-preview.main'
import { rectHasPoint } from '../../utils/rectHasPoint'
import { dragInsertEnded, dragInsertMove, dragInsertStarted } from '../helpers'
import { postMessageToEditor } from '../postMessageToEditor'
import type { DragInsertState } from '../types'

export const handleInsertStarted = (
  messageData: { x: number; y: number },
  highlightedNodeId: string | null,
): DragInsertState | null => {
  const highlightedElement = getDOMNodeFromNodeId(highlightedNodeId)
  if (!highlightedElement?.parentElement) {
    return null
  }
  const repeatedNodes = Array.from(highlightedElement.children).filter(
    (node) =>
      node instanceof HTMLElement &&
      node.getAttribute('data-id')?.startsWith(highlightedNodeId + '('),
  ) as HTMLElement[]

  const element = document.createElement('div') as HTMLElement

  const insertState = dragInsertStarted({
    action: 'insert',
    element,
    initialContainer: highlightedElement as HTMLElement,
    lastCursorPosition: { x: messageData.x, y: messageData.y },
    repeatedNodes,
    asCopy: false,
  })

  return insertState
}

export const handleInsertMouseMove = (
  messageData: { x: number; y: number },
  insertState: DragInsertState,
) => {
  const { x, y } = messageData
  insertState.lastCursorPosition = { x, y }

  const rect = insertState.element.getBoundingClientRect()
  if (!rectHasPoint(rect, { x, y })) {
    insertState.offset.x -= (x - (rect.left + rect.width / 2)) * 0.1
    insertState.offset.y -= (y - (rect.top + rect.height / 2)) * 0.1
  }

  dragInsertMove('insert', insertState, [insertState.element])
}

export const handleInsertEnded = async (
  messageData: { canceled?: boolean },
  insertState: DragInsertState,
): Promise<DragInsertState | null> => {
  const selectedPermutation =
    insertState?.insertAreas?.[insertState?.selectedInsertAreaIndex ?? -1]
  if (selectedPermutation && !messageData.canceled) {
    await dragInsertEnded(insertState, false)

    postMessageToEditor({
      type: 'insertNode',
      parent: selectedPermutation.parent.getAttribute('data-id'),
      index: selectedPermutation.index,
    })
    return null
  } else {
    await dragInsertEnded(insertState, true)
    return null
  }
}
