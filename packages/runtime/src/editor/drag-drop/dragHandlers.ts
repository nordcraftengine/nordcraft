import type { Component } from '@nordcraft/core/dist/component/component.types'
import { getDOMNodeFromNodeId } from '../../editor-preview.main'
import { rectHasPoint } from '../../utils/rectHasPoint'
import { dragInsertEnded, dragInsertMove, dragInsertStarted } from '../helpers'
import { postMessageToEditor } from '../postMessageToEditor'
import type { DragInsertState } from '../types'
import { dragReorder } from './dragReorder'

export const handleDragStarted = (
  messageData: { x: number; y: number },
  selectedNodeId: string | null,
  altKey: boolean,
): DragInsertState | null => {
  const draggedElement = getDOMNodeFromNodeId(selectedNodeId)
  if (!draggedElement?.parentElement) {
    return null
  }
  const repeatedNodes = Array.from(
    draggedElement.parentElement.children,
  ).filter(
    (node) =>
      node instanceof HTMLElement &&
      node.getAttribute('data-id')?.startsWith(selectedNodeId + '('),
  ) as HTMLElement[]

  const dragState = dragInsertStarted({
    action: 'drag',
    element: draggedElement as HTMLElement,
    lastCursorPosition: { x: messageData.x, y: messageData.y },
    repeatedNodes,
    asCopy: altKey,
  })

  if (altKey && dragState) {
    const nextRect = dragState.element.getBoundingClientRect()
    dragState.offset.x += nextRect.left - dragState.initialRect.left
    dragState.offset.y += nextRect.top - dragState.initialRect.top
  }

  return dragState
}

export const handleDragMouseMove = (
  messageData: { x: number; y: number },
  dragState: DragInsertState,
  metaKey: boolean,
) => {
  const { x, y } = messageData
  dragState.lastCursorPosition = { x, y }
  const draggingInsideContainer = rectHasPoint(
    dragState.initialContainer.getBoundingClientRect(),
    { x, y },
  )
  const rect = dragState.element.getBoundingClientRect()
  if (!rectHasPoint(rect, { x, y })) {
    dragState.offset.x -= (x - (rect.left + rect.width / 2)) * 0.1
    dragState.offset.y -= (y - (rect.top + rect.height / 2)) * 0.1
  }
  if (draggingInsideContainer && !metaKey) {
    void dragReorder(dragState)
  } else {
    dragInsertMove(
      'drag',
      dragState,
      metaKey
        ? [dragState.element]
        : [dragState.element, dragState.initialContainer],
    )
  }
  dragState.element.style.setProperty(
    'translate',
    `${x - dragState.offset.x}px ${y - dragState.offset.y}px`,
  )
}

export const handleDragAltToggle = async (
  asCopy: boolean,
  dragState: DragInsertState,
): Promise<DragInsertState | null> => {
  const prevRect = dragState.element.getBoundingClientRect()
  await dragInsertEnded(dragState, true)
  const newState = dragInsertStarted({
    action: 'drag',
    element: dragState.element,
    lastCursorPosition: dragState.lastCursorPosition,
    repeatedNodes: dragState.repeatedNodes,
    asCopy,
    initialContainer: dragState.initialContainer,
    initialNextSibling: dragState.initialNextSibling,
  })

  if (newState) {
    const nextRect = newState.element.getBoundingClientRect()
    newState.offset.x += nextRect.left - prevRect.left
    newState.offset.y += nextRect.top - prevRect.top
  }

  return newState
}

export const handleDragEnded = async (
  messageData: { canceled?: boolean },
  dragState: DragInsertState,
  component: Component | null,
): Promise<DragInsertState | null> => {
  switch (dragState?.mode) {
    case 'reorder': {
      const parentDataId = dragState?.initialContainer.getAttribute('data-id')
      const parentNodeId =
        dragState?.initialContainer.getAttribute('data-node-id')
      if (!parentDataId || !parentNodeId) {
        return dragState
      }

      const nextSibling = dragState?.element.nextElementSibling
      const nextSiblingId = parseInt(
        nextSibling?.getAttribute('data-id')?.split('.').at(-1) ?? '',
      )

      const rect = dragState?.element?.getBoundingClientRect()
      if (
        rect &&
        !messageData.canceled &&
        (nextSibling !== dragState?.initialNextSibling || dragState?.copy)
      ) {
        await dragInsertEnded(dragState, false)
        postMessageToEditor({
          type: 'nodeMoved',
          copy: Boolean(dragState?.copy),
          parent: parentDataId,
          index: !isNaN(nextSiblingId)
            ? nextSiblingId
            : component?.nodes?.[parentNodeId]?.children?.length,
        })
        return null
      } else {
        await dragInsertEnded(dragState, true)
        return null
      }
    }
    case 'insert': {
      const selectedPermutation =
        dragState?.insertAreas?.[dragState?.selectedInsertAreaIndex ?? -1]
      if (selectedPermutation && !messageData.canceled) {
        await dragInsertEnded(dragState, false)
        postMessageToEditor({
          type: 'nodeMoved',
          copy: Boolean(dragState?.copy),
          parent: selectedPermutation?.parent.getAttribute('data-id'),
          index: selectedPermutation?.index,
        })
        return null
      } else {
        await dragInsertEnded(dragState, true)
        return null
      }
    }
    case undefined:
      return null
  }
  return dragState
}
