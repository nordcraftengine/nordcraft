import { isElementInViewport } from '../../utils/isElementInViewport'
import { tryStartViewTransition } from '../../utils/tryStartViewTransition'
import type { DragState } from '../types'
import { DRAG_MOVE_CLASSNAME } from './dragMove'
import { setDropHighlight } from './dropHighlight'

export const DRAG_REORDER_CLASSNAME = '__drag-mode--reorder'
const OVERLAP_OFFSET_PX = 100

export function dragReorder(dragState: DragState | null) {
  if (!dragState || dragState.isTransitioning) {
    return
  }

  // If the drag operation was an insert operation, we need to switch to reorder mode and perform some one-time preparation
  if (dragState.mode === 'insert') {
    dragState.mode = 'reorder'

    // Move back to the original container
    const prevRect = dragState.element.getBoundingClientRect()
    dragState.element.classList.add(DRAG_REORDER_CLASSNAME)
    dragState.element.classList.remove(DRAG_MOVE_CLASSNAME)
    dragState.initialContainer.insertBefore(
      dragState.element,
      dragState.initialNextSibling,
    )
    dragState.repeatedNodes.forEach((node, i) => {
      node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '1' : '0')
    })
    const nextRect = dragState.element.getBoundingClientRect()
    dragState.offset.x += nextRect.left - prevRect.left
    dragState.offset.y += nextRect.top - prevRect.top
    window.parent?.postMessage(
      {
        type: 'highlight',
        highlightedNodeId: dragState.initialContainer.getAttribute('data-id'),
      },
      '*',
    )
    setDropHighlight(
      dragState.element,
      dragState.initialContainer,
      dragState.elementType === 'component' ? 'D946EF' : '2563EB',
    )
  }

  const bestPermutation = getBestPermutation(dragState)
  if (
    bestPermutation &&
    dragState.element.nextElementSibling !== bestPermutation.nextSibling
  ) {
    dragState.isTransitioning = true
    const siblings = Array.from(dragState.initialContainer.childNodes)
    siblings
      .filter((sibling) => sibling instanceof HTMLElement)
      .filter(isElementInViewport)
      .forEach((sibling, i) => {
        sibling.style.setProperty('view-transition-name', 'item-' + i)
      })
    dragState.element.style.setProperty('view-transition-name', '__drag-item')

    const prevLeft = dragState.element.offsetLeft
    const prevTop = dragState.element.offsetTop
    const transition = tryStartViewTransition(() => {
      if (!dragState) {
        return
      }
      dragState.initialContainer.insertBefore(
        dragState.element,
        bestPermutation.nextSibling,
      )
      dragState.offset.x += dragState.element.offsetLeft - prevLeft
      dragState.offset.y += dragState.element.offsetTop - prevTop
      dragState?.element.style.setProperty(
        'translate',
        `${dragState.lastCursorPosition.x - dragState.offset.x}px ${
          dragState.lastCursorPosition.y - dragState.offset.y
        }px`,
      )
      setDropHighlight(
        dragState.element,
        dragState.initialContainer,
        dragState.elementType === 'component' ? 'D946EF' : '2563EB',
      )
    })

    transition.finished
      .then(() => {
        siblings.forEach((sibling) => {
          if (sibling instanceof HTMLElement) {
            sibling.style.removeProperty('view-transition-name')
          }
        })
        if (dragState) {
          dragState.isTransitioning = false
        }
      })
      .catch(() => {})
  }
}

/**
 * Return the most likely permutation to move the dragged element to based on the current drag position.
 * The calculation is based on distance from the center of the dragged element to the center of the potential target element,
 * but only if the dragged element is overlapping with the target element.
 */
function getBestPermutation(dragState: DragState) {
  const { left, top, width, height } = dragState.element.getBoundingClientRect()
  const dragElementCenterX = left + width / 2
  const dragElementCenterY = top + height / 2
  return dragState.reorderPermutations.reduce<null | {
    rect: DOMRect
    nextSibling: Node | null
  }>((prev, curr) => {
    const isOverlapping =
      Math.abs(curr.rect.left + curr.rect.width / 2 - dragElementCenterX) <
        curr.rect.width / 2 + OVERLAP_OFFSET_PX &&
      Math.abs(curr.rect.top + curr.rect.height / 2 - dragElementCenterY) <
        curr.rect.height / 2 + OVERLAP_OFFSET_PX
    if (isOverlapping) {
      if (!prev) {
        return curr
      }

      const prevDist = Math.hypot(
        prev.rect.left + prev.rect.width / 2 - dragElementCenterX,
        prev.rect.top + prev.rect.height / 2 - dragElementCenterY,
      )
      const nextDist = Math.hypot(
        curr.rect.left + curr.rect.width / 2 - dragElementCenterX,
        curr.rect.top + curr.rect.height / 2 - dragElementCenterY,
      )

      return prevDist < nextDist ? prev : curr
    }

    return prev
  }, null)
}
