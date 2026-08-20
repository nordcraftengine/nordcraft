import { isElementInViewport } from '../../utils/isElementInViewport'
import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import { tryStartViewTransition } from '../../utils/tryStartViewTransition'
import { getBestPermutation } from '../helpers'
import type { DragState } from '../types'
import { DRAG_MOVE_CLASSNAME } from './dragMove'
import { setDropHighlight } from './dropHighlight'

export const DRAG_REORDER_CLASSNAME = '__drag-mode--reorder'

export async function dragReorder(dragState: DragState | null) {
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
    const nodeId = dragState.initialContainer.getAttribute('data-id')
    window.parent?.postMessage(
      {
        type: 'highlight',
        highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
        exactHighlightedNodeId: nodeId,
      },
      '*',
    )
    setDropHighlight(
      dragState.element,
      dragState.initialContainer,
      dragState.elementType === 'component' ? 'D946EF' : '2563EB',
    )
  }

  const bestPermutation = getBestPermutation(
    dragState.element,
    dragState.reorderPermutations,
  )
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

    const style = document.createElement('style')
    style.appendChild(
      document.createTextNode(`
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation-timing-function: linear(0 0%, 0.0054 1.2376%, 0.0185 2.4752%, 0.0736 5.4455%, 0.5418 22.0297%, 0.6654 27.4752%, 0.7624 32.9208%, 0.8437 39.1089%, 0.9056 46.0396%, 0.929 49.7525%, 0.9492 53.9604%, 0.965 58.4158%, 0.9773 63.3663%, 0.9875 69.802%, 0.9945 77.7228%, 0.9982 87.1287%, 0.9999 100% /*{"type":"spring","stiffness":75,"damping":36,"mass":5}*/) !important;
        animation-duration: 0.2s !important;
      }
    `),
    )
    document.head.appendChild(style)

    await tryStartViewTransition(() => {
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
    }).finished

    style.remove()
    siblings.forEach((sibling) => {
      if (sibling instanceof HTMLElement) {
        sibling.style.removeProperty('view-transition-name')
      }
    })
    if (dragState) {
      dragState.isTransitioning = false
    }
  }
}
