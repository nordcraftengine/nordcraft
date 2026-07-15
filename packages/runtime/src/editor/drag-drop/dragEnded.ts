import { isElementInViewport } from '../../utils/isElementInViewport'
import { tryStartViewTransition } from '../../utils/tryStartViewTransition'
import type { DragState } from '../types'
import { DRAG_MOVE_CLASSNAME } from './dragMove'
import { DRAG_REORDER_CLASSNAME } from './dragReorder'
import { removeDropHighlight } from './dropHighlight'

export async function dragEnded(dragState: DragState, canceled: boolean) {
  dragState.destroying = true
  const selectedInsertArea =
    dragState.insertAreas?.[dragState.selectedInsertAreaIndex ?? -1]
  const siblings =
    (dragState.mode === 'insert' && !canceled
      ? selectedInsertArea?.parent
      : dragState.initialContainer
    )?.querySelectorAll('[data-id]') ?? []
  dragState.element.style.setProperty(
    'view-transition-name',
    'dropped-item-self',
  )
  siblings.forEach((node, i) => {
    if (node instanceof HTMLElement && isElementInViewport(node)) {
      node.style.setProperty(
        'view-transition-name',
        'dropped-item-sibling-' + i,
      )
    }
  })
  dragState.repeatedNodes.filter(isElementInViewport).forEach((node, i) => {
    node.style.setProperty('view-transition-name', 'dropped-item-repeated-' + i)
  })

  const style = document.createElement('style')
  style.appendChild(
    document.createTextNode(`
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation-timing-function: linear(0 0%, 0.005 0.9404%, 0.0202 2.0376%, 0.0775 4.3887%, 0.5344 17.0846%, 0.6528 21.1599%, 0.7502 25.3918%, 0.8332 30.2508%, 0.8943 35.4232%, 0.9185 38.2445%, 0.9385 41.2226%, 0.9554 44.5141%, 0.9689 48.1191%, 0.9825 53.605%, 0.9876 56.7398%, 0.9913 59.8746%, 0.9944 63.6364%, 0.9966 67.7116%, 0.9992 78.6834%, 1 100% /*{"type":"spring","stiffness":50,"damping":30,"mass":5}*/) !important;
        animation-duration: 0.4s !important;
      }
    `),
  )
  document.head.appendChild(style)

  await tryStartViewTransition(() => {
    if (canceled) {
      dragState.copy?.remove()
      dragState.initialContainer.insertBefore(
        dragState.element,
        dragState.initialNextSibling,
      )
    } else if (dragState.mode === 'insert') {
      selectedInsertArea?.parent.insertBefore(
        dragState.element,
        selectedInsertArea.parent.childNodes[selectedInsertArea.index],
      )
    }

    dragState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    dragState.element.classList.remove(DRAG_MOVE_CLASSNAME)
    dragState.element.style.removeProperty('translate')
    dragState.repeatedNodes.toReversed().forEach((node) => {
      dragState.element.insertAdjacentElement('afterend', node)
      node.classList.remove('drag-repeat-node')
      node.style.removeProperty('rotate')
      node.style.removeProperty('--drag-repeat-node-width')
      node.style.removeProperty('--drag-repeat-node-height')
      node.style.removeProperty('--drag-repeat-node-translate')
      node.style.removeProperty('--drag-repeat-node-rotate')
      node.style.removeProperty('--drag-repeat-node-opacity')
    })
    removeDropHighlight()
  }).finished

  style.remove()
  dragState.element.style.removeProperty('view-transition-name')
  siblings.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.removeProperty('view-transition-name')
    }
  })
}
