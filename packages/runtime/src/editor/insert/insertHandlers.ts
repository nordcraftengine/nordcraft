import { getDOMNodeFromNodeId } from '../../editor-preview.main'
import { rectHasPoint } from '../../utils/rectHasPoint'
import { postMessageToEditor } from '../postMessageToEditor'
import type { InsertState } from '../types'
import { insertEnded } from './insertEnded'
import { insertMove } from './insertMove'
import { insertStarted } from './insertStarted'

export const handleInsertStarted = (
  messageData: { x: number; y: number },
  highlightedNodeId: string | null,
): InsertState | null => {
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

  const insertState = insertStarted({
    element,
    initialContainer: highlightedElement as HTMLElement,
    lastCursorPosition: { x: messageData.x, y: messageData.y },
    repeatedNodes,
  })

  return insertState
}

export const handleInsertMouseMove = (
  messageData: { x: number; y: number },
  insertState: InsertState,
) => {
  const { x, y } = messageData
  insertState.lastCursorPosition = { x, y }

  const rect = insertState.element.getBoundingClientRect()
  if (!rectHasPoint(rect, { x, y })) {
    insertState.offset.x -= (x - (rect.left + rect.width / 2)) * 0.1
    insertState.offset.y -= (y - (rect.top + rect.height / 2)) * 0.1
  }

  insertMove(insertState, [insertState.element])
}

export const handleInsertEnded = async (
  messageData: { canceled?: boolean },
  insertState: InsertState,
): Promise<InsertState | null> => {
  const selectedPermutation =
    insertState?.insertAreas?.[insertState?.selectedInsertAreaIndex ?? -1]
  if (selectedPermutation && !messageData.canceled) {
    await insertEnded(insertState, false)

    postMessageToEditor({
      type: 'insertNode',
      parent: selectedPermutation.parent.getAttribute('data-id'),
      index: selectedPermutation.index,
    })
    return null
  } else {
    await insertEnded(insertState, true)
    return null
  }
}
