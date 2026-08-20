import { isElementInViewport } from '../../utils/isElementInViewport'
import { tryStartViewTransition } from '../../utils/tryStartViewTransition'
import { removeDropHighlight } from '../drag-drop/dropHighlight'
import type { InsertState } from '../types'
import { INSERT_MOVE_CLASSNAME } from './insertMove'
import { INSERT_REORDER_CLASSNAME } from './insertStarted'

export async function insertEnded(insertState: InsertState, canceled: boolean) {
  insertState.destroying = true
  const selectedInsertArea =
    insertState.insertAreas?.[insertState.selectedInsertAreaIndex ?? -1]
  const siblings =
    (!canceled
      ? selectedInsertArea?.parent
      : insertState.initialContainer
    )?.querySelectorAll('[data-id]') ?? []
  insertState.element.style.setProperty(
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
  insertState.repeatedNodes.filter(isElementInViewport).forEach((node, i) => {
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
      insertState.initialContainer.insertBefore(
        insertState.element,
        insertState.initialNextSibling,
      )
    } else {
      selectedInsertArea?.parent.insertBefore(
        insertState.element,
        selectedInsertArea.parent.childNodes[selectedInsertArea.index],
      )
    }

    insertState.element.classList.remove(INSERT_REORDER_CLASSNAME)
    insertState.element.classList.remove(INSERT_MOVE_CLASSNAME)
    insertState.element.style.removeProperty('translate')
    insertState.repeatedNodes.toReversed().forEach((node) => {
      insertState.element.insertAdjacentElement('afterend', node)
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
  insertState.element.style.removeProperty('view-transition-name')
  siblings.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.removeProperty('view-transition-name')
    }
  })
}
