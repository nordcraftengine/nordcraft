import type { Component } from '@nordcraft/core/dist/component/component.types'
import { rectHasPoint } from '../../utils/rectHasPoint'
import { getDOMNodeFromNodeId } from '../dom'
import {
  DRAG_INSERT_CLASSNAME,
  applyDropParentStyles,
  cancelHoverInsert,
  centerGhostOnCursor,
  dragInsertEnded,
  dragInsertMove,
  dragInsertStarted,
  dropStylePropsOf,
  getPrimaryChildElements,
  isPrimaryNodeElement,
  measureReorderPermutations,
  nodeIndexFromId,
  postHighlightMessage,
} from '../helpers'
import { postMessageToEditor } from '../postMessageToEditor'
import type { DragInsertState } from '../types'
import { DRAG_REORDER_CLASSNAME, dragReorder } from './dragReorder'
import { setDropHighlight, setHighlightBlink } from './dropHighlight'

export const HOVER_STILL_MS = 1000
export const HOVER_BLINK_MS = 600
export const HOVER_BLINK_TICK_MS = 150

export const handleDragStarted = (
  messageData: { x: number; y: number },
  selectedNodeId: string | null,
  altKey: boolean,
): DragInsertState | null => {
  const draggedElement = getDOMNodeFromNodeId(selectedNodeId)
  if (
    !(draggedElement instanceof HTMLElement) ||
    !draggedElement.parentElement
  ) {
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
    element: draggedElement,
    lastCursorPosition: { x: messageData.x, y: messageData.y },
    repeatedNodes,
    asCopy: altKey,
  })

  if (altKey) {
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
  dragState.metaKey = metaKey
  const containerRect = dragState.initialContainer.getBoundingClientRect()
  const tolerance = dragState.trueOrigin ? 16 : 0
  const draggingInsideContainer = rectHasPoint(
    containerRect,
    { x, y },
    tolerance,
  )
  const rect = dragState.element.getBoundingClientRect()
  if (!rectHasPoint(rect, { x, y })) {
    dragState.offset.x -= (x - (rect.left + rect.width / 2)) * 0.1
    dragState.offset.y -= (y - (rect.top + rect.height / 2)) * 0.1
  }
  // A lone element has no reorder targets: it goes to insert mode so it can
  // be placed in any of the 9 spots (duplicate drags count the copy too and
  // stay in reorder; CMD still forces insert mode).
  if (draggingInsideContainer && !metaKey && !dragState.isSoleChildDrag) {
    // Back to reordering: any hovered insert target is gone.
    cancelHoverInsert(dragState)
    void dragReorder(dragState)
  } else {
    // A sole-child drag keeps its (now empty) origin container eligible so
    // the 9 spots stay available — same exclusion as the CMD flow.
    // Exclude the true origin container, not the re-homed container.
    const originContainer =
      dragState.trueOrigin?.container ?? dragState.initialContainer
    const exclude =
      metaKey || dragState.isSoleChildDrag || Boolean(dragState.copy)
        ? [dragState.element]
        : [dragState.element, originContainer]
    dragInsertMove('drag', dragState, exclude)
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
  if (dragState.destroying) {
    return null
  }

  const originContainer =
    dragState.trueOrigin?.container ?? dragState.initialContainer
  const originNextSibling = dragState.trueOrigin
    ? dragState.trueOrigin.nextSibling
    : dragState.initialNextSibling

  if (asCopy) {
    if (!dragState.copy) {
      const copy = dragState.element.cloneNode(true) as HTMLElement
      copy.style.setProperty('opacity', '0.5')
      copy.classList.remove(DRAG_REORDER_CLASSNAME)
      copy.classList.remove(DRAG_INSERT_CLASSNAME)
      copy.style.removeProperty('translate')
      for (const prop of [
        '--drag-mode--move-left',
        '--drag-mode--move-top',
        '--drag-mode--move-width',
        '--drag-mode--move-opacity',
      ]) {
        copy.style.removeProperty(prop)
      }
      originContainer.insertBefore(copy, originNextSibling)
      dragState.copy = copy

      const homeChildren = Array.from(
        dragState.initialContainer.children,
      ).filter((child) => child.hasAttribute('data-node-id'))
      const elementHome =
        dragState.element.parentElement === dragState.initialContainer
      dragState.isSoleChildDrag =
        homeChildren.length + (elementHome ? 0 : 1) === 1
    }
  } else {
    if (dragState.copy) {
      dragState.copy.remove()
      dragState.copy = undefined

      const homeChildren = Array.from(
        dragState.initialContainer.children,
      ).filter((child) => child.hasAttribute('data-node-id'))
      const elementHome =
        dragState.element.parentElement === dragState.initialContainer
      dragState.isSoleChildDrag =
        homeChildren.length + (elementHome ? 0 : 1) === 1
    }
  }

  centerGhostOnCursor(dragState)

  // Recalculate reorder permutations for current container
  dragState.reorderPermutations = measureReorderPermutations(
    dragState.initialContainer,
    dragState.element,
    dragState.repeatedNodes,
  )

  // Invalidate and recalculate drop areas to account for layout shifts and eligibility
  dragState.insertAreas = undefined
  const exclude =
    dragState.metaKey || dragState.isSoleChildDrag || Boolean(dragState.copy)
      ? [dragState.element]
      : [dragState.element, originContainer]

  if (dragState.mode === 'insert') {
    dragInsertMove('drag', dragState, exclude)
  } else if (dragState.mode === 'reorder') {
    void dragReorder(dragState)
  }

  return dragState
}

async function restartDrag(
  dragState: DragInsertState,
  init: {
    action: 'drag' | 'insert'
    asCopy: boolean
    initialContainer: HTMLElement
    initialNextSibling: Element | null
    carryAreas: boolean
    trueOrigin?: DragInsertState['trueOrigin']
  },
): Promise<DragInsertState | null> {
  const wasInsert = dragState.mode === 'insert'
  const carriedAreas =
    wasInsert && init.carryAreas ? dragState.insertAreas : undefined
  const carriedSelection =
    wasInsert && init.carryAreas ? dragState.selectedInsertAreaIndex : undefined
  const trueOrigin = init.trueOrigin ?? dragState.trueOrigin
  await dragInsertEnded(dragState, true, { instant: true })
  const newState = dragInsertStarted({
    action: init.action,
    element: dragState.element,
    lastCursorPosition: dragState.lastCursorPosition,
    repeatedNodes: dragState.repeatedNodes,
    asCopy: init.asCopy,
    initialContainer: init.initialContainer,
    initialNextSibling: init.initialNextSibling,
    trueOrigin,
  })

  newState.trueOrigin = trueOrigin
  centerGhostOnCursor(newState)
  if (carriedAreas) {
    newState.insertAreas = carriedAreas
    newState.selectedInsertAreaIndex = carriedSelection
    dragInsertMove('drag', newState, [
      newState.element,
      newState.initialContainer,
    ])
  }

  return newState
}

function parentHasElements(parent: Element): boolean {
  return Array.from(parent.children).some(isPrimaryNodeElement)
}

export function trackHoverTarget(
  dragState: DragInsertState,
  onReplace: (next: DragInsertState | null) => void,
  options?: {
    stillMs?: number
    blinkMs?: number
    metaKey?: boolean
  },
): void {
  const isMeta = options?.metaKey ?? dragState.metaKey ?? false
  if (dragState.destroying || isMeta) {
    cancelHoverInsert(dragState)
    return
  }
  const key =
    dragState.mode === 'insert' ? dragState.selectedInsertAreaIndex : undefined
  const selected = key !== undefined ? dragState.insertAreas?.[key] : undefined
  const trackedKey =
    selected &&
    !selected.slotPlaceholder &&
    !selected.bounds &&
    parentHasElements(selected.parent)
      ? key
      : undefined
  if (trackedKey === undefined || trackedKey !== dragState.hover?.key) {
    cancelHoverInsert(dragState)
    if (trackedKey === undefined) {
      return
    }
    const hover: NonNullable<DragInsertState['hover']> = (dragState.hover = {
      key: trackedKey,
      blinking: false,
    })
    const isAborted = () =>
      dragState.destroying ||
      dragState.hover !== hover ||
      (dragState.metaKey ?? false)
    const stillMs = options?.stillMs ?? HOVER_STILL_MS
    const blinkMs = options?.blinkMs ?? HOVER_BLINK_MS

    hover.timeout = setTimeout(() => {
      if (isAborted()) {
        cancelHoverInsert(dragState)
        return
      }
      hover.blinking = true
      setHighlightBlink(true, false)
      let hidden = false
      hover.interval = setInterval(() => {
        if (isAborted()) {
          cancelHoverInsert(dragState)
          return
        }
        hidden = !hidden
        setHighlightBlink(true, hidden)
      }, HOVER_BLINK_TICK_MS)
      hover.timeout = setTimeout(() => {
        if (isAborted() || dragState.selectedInsertAreaIndex !== hover.key) {
          cancelHoverInsert(dragState)
          return
        }
        void hoverInsert(dragState, onReplace).catch(() => {})
      }, blinkMs)
    }, stillMs)
  }
}

async function hoverInsert(
  dragState: DragInsertState,
  onReplace: (next: DragInsertState | null) => void,
): Promise<void> {
  const selected =
    dragState.insertAreas?.[dragState.selectedInsertAreaIndex ?? -1]
  if (!selected || dragState.destroying) {
    return
  }
  cancelHoverInsert(dragState)
  const targetSiblings = getPrimaryChildElements(selected.parent)
  const nextSibling = targetSiblings[selected.indexAll] ?? null
  const trueOrigin = dragState.trueOrigin ?? {
    container: dragState.initialContainer,
    nextSibling: dragState.initialNextSibling,
  }
  const next = await restartDrag(dragState, {
    action: dragState.action,
    asCopy: Boolean(dragState.copy),
    initialContainer: selected.parent as HTMLElement,
    initialNextSibling: nextSibling,
    carryAreas: false,
    trueOrigin,
  })
  if (!next) {
    return
  }
  const newHome = selected.parent as HTMLElement
  applyDropParentStyles(newHome, selected)
  newHome.insertBefore(next.element, nextSibling)
  centerGhostOnCursor(next)
  next.reorderPermutations = measureReorderPermutations(
    newHome,
    next.element,
    next.repeatedNodes,
  )
  next.initialRect = next.element.getBoundingClientRect()
  setDropHighlight(
    next.element,
    newHome,
    next.elementType === 'component' ? 'D946EF' : '2563EB',
  )
  postHighlightMessage(newHome)
  next.hoverPlacement = {
    parent: selected.parent,
    index: selected.index,
    slot: selected.slot,
    styleProps: dropStylePropsOf(selected),
  }
  onReplace(next)
}

export const handleDragEnded = async (
  messageData: { canceled?: boolean },
  dragState: DragInsertState,
  component: Component | null,
): Promise<DragInsertState | null> => {
  switch (dragState.mode) {
    case 'reorder': {
      const parentDataId = dragState.initialContainer.getAttribute('data-id')
      const parentNodeId =
        dragState.initialContainer.getAttribute('data-node-id')
      if (!parentDataId || !parentNodeId) {
        return dragState
      }

      const targetSiblings = getPrimaryChildElements(dragState.initialContainer)
      const myIndex = targetSiblings.indexOf(dragState.element)
      const nextValidSibling =
        myIndex !== -1
          ? targetSiblings[myIndex + 1]
          : dragState.element.nextElementSibling
      const nextSiblingId = nodeIndexFromId(
        nextValidSibling?.getAttribute('data-id'),
      )

      let resolvedIndex: number | undefined = !Number.isNaN(nextSiblingId)
        ? nextSiblingId
        : undefined
      if (resolvedIndex === undefined && myIndex > 0) {
        const prevId = nodeIndexFromId(
          targetSiblings[myIndex - 1]?.getAttribute('data-id'),
        )
        if (!Number.isNaN(prevId)) {
          resolvedIndex = prevId + 1
        }
      }
      resolvedIndex ??=
        component?.nodes?.[parentNodeId]?.children?.length ??
        (myIndex !== -1 ? myIndex : undefined)

      const nextSibling = dragState.element.nextElementSibling
      const origin = dragState.trueOrigin
      const parentChanged = origin
        ? dragState.initialContainer !== origin.container
        : false
      const anchorNextSibling = origin
        ? origin.nextSibling
        : dragState.initialNextSibling
      if (
        !messageData.canceled &&
        (parentChanged || nextSibling !== anchorNextSibling || dragState.copy)
      ) {
        await dragInsertEnded(dragState, false)
        postMessageToEditor({
          type: 'nodeMoved',
          copy: Boolean(dragState.copy),
          parent: parentDataId,
          index: resolvedIndex,
          slot: dragState.hoverPlacement?.slot,
          ...dragState.hoverPlacement?.styleProps,
        })
        return null
      } else {
        await dragInsertEnded(dragState, true)
        return null
      }
    }
    case 'insert': {
      const selectedPermutation =
        dragState.insertAreas?.[dragState.selectedInsertAreaIndex ?? -1]
      const styleProps = dropStylePropsOf(selectedPermutation)
      if (selectedPermutation && !messageData.canceled) {
        await dragInsertEnded(dragState, false)
        postMessageToEditor({
          type: 'nodeMoved',
          copy: Boolean(dragState.copy),
          parent: selectedPermutation.parent.getAttribute('data-id'),
          index: selectedPermutation.index,
          slot: selectedPermutation.slot,
          ...styleProps,
        })
        return null
      } else {
        await dragInsertEnded(dragState, true)
        return null
      }
    }
  }
}
