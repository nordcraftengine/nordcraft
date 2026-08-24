import { findNearestLine } from '../utils/findNearestLine'
import { isElementInViewport } from '../utils/isElementInViewport'
import { stripNodeIdRepeatIndices } from '../utils/nodes'
import { tryStartViewTransition } from '../utils/tryStartViewTransition'
import { DRAG_REORDER_CLASSNAME } from './drag-drop/dragReorder'
import {
  removeDropHighlight,
  setDropHighlight,
  setExternalDropHighlight,
} from './drag-drop/dropHighlight'
import { getInsertAreas } from './drag-drop/getInsertAreas'
import type { DragInsertState, Point } from './types'

const OVERLAP_OFFSET_PX = 100
export const DRAG_MOVE_CLASSNAME = '__drag-mode--move'

/**
 * Return the most likely permutation to move the dragged element to based on the current drag position.
 * The calculation is based on distance from the center of the dragged element to the center of the potential target element,
 * but only if the dragged element is overlapping with the target element.
 */
export function getBestPermutation(
  element: HTMLElement,
  reorderPermutations: Array<{
    nextSibling: Node | null
    rect: DOMRect
  }>,
) {
  const { left, top, width, height } = element.getBoundingClientRect()
  const dragElementCenterX = left + width / 2
  const dragElementCenterY = top + height / 2
  return reorderPermutations.reduce<null | {
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

export function dragInsertStarted({
  action,
  element,
  lastCursorPosition,
  repeatedNodes,
  asCopy,
  initialContainer = action === 'drag'
    ? (element.parentElement as HTMLElement)
    : (element as HTMLElement),
  initialNextSibling,
}: {
  action: 'drag' | 'insert'
  element: HTMLElement
  lastCursorPosition: Point
  repeatedNodes: HTMLElement[]
  asCopy: boolean
  initialContainer?: HTMLElement
  initialNextSibling?: Element | null
}) {
  // Move repeat nodes as a stack below the dragged element
  repeatedNodes
    .map<[HTMLElement, DOMRect]>((node) => [node, node.getBoundingClientRect()])
    .forEach(([node, rect], i) => {
      node.classList.add('drag-repeat-node')
      node.style.setProperty('--drag-repeat-node-width', `${rect.width}px`)
      node.style.setProperty('--drag-repeat-node-height', `${rect.height}px`)
      node.style.setProperty(
        '--drag-repeat-node-translate',
        `${rect.left}px ${rect.top}px`,
      )
      node.style.setProperty(
        '--drag-repeat-node-rotate',
        `${Math.random() * 9 - 4.5}deg`,
      )
      node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '1' : '0')
    })

  initialNextSibling ??= element.nextElementSibling

  const dragInsertState: DragInsertState = {
    destroying: false,
    elementType:
      elementIsComponent(element) && action === 'drag'
        ? 'component'
        : 'element',
    element,
    offset: lastCursorPosition,
    lastCursorPosition,
    initialContainer,
    initialNextSibling,
    initialRect:
      action === 'drag'
        ? element.getBoundingClientRect()
        : initialContainer.getBoundingClientRect(),
    reorderPermutations: [],
    isTransitioning: false,
    repeatedNodes,
    mode: action === 'drag' ? 'reorder' : 'insert',
  }

  if (asCopy && action === 'drag') {
    dragInsertState.copy = element.cloneNode(true) as HTMLElement
    dragInsertState.copy.style.setProperty('opacity', '0.5')
    dragInsertState.copy.classList.remove(DRAG_REORDER_CLASSNAME)
    dragInsertState.copy.classList.remove(DRAG_MOVE_CLASSNAME)
    dragInsertState.initialContainer.insertBefore(
      dragInsertState.copy,
      dragInsertState.initialNextSibling,
    )
  }

  // Calculate all possible permutations, by iterating over all siblings of the targetContainer
  // and moving the draggedElement to before each sibling to calculate the rect and then
  // store it in the dragState.permutations array
  dragInsertState.initialContainer.childNodes.forEach((sibling) => {
    if (
      sibling instanceof Element &&
      sibling.getAttribute('data-id') &&
      // Only first item of repeated nodes should be considered
      !sibling.getAttribute('data-id')?.endsWith(')') &&
      !sibling.hasAttribute('data-component') &&
      repeatedNodes.every((node) => node !== sibling)
    ) {
      dragInsertState.initialContainer.insertBefore(element, sibling)
      dragInsertState.reorderPermutations.push({
        nextSibling: sibling,
        rect: element.getBoundingClientRect(),
      })
    }
  })
  // Test the last position
  if (!dragInsertState.initialContainer.hasAttribute('data-component')) {
    dragInsertState.initialContainer.appendChild(element)
    dragInsertState.reorderPermutations.push({
      nextSibling: null,
      rect: element.getBoundingClientRect(),
    })
  }
  // Restore the initial position of the draggedElement
  dragInsertState.initialContainer.insertBefore(
    element,
    dragInsertState.initialNextSibling,
  )
  ;(function followRepeatedNodes() {
    if (dragInsertState.destroying || !dragInsertState.element.isConnected) {
      return
    }

    const followRect = dragInsertState.element.getBoundingClientRect()
    dragInsertState.repeatedNodes.forEach((node) => {
      // Calculate rect without rotation as it expands the rect and makes it difficult to calculate the correct position
      node.style.setProperty('rotate', '0deg')
      const fromRect = node.getBoundingClientRect()
      node.style.removeProperty('rotate')
      const toX = followRect.left + followRect.width / 2 - fromRect.width / 2
      const toY = followRect.top + followRect.height / 2 - fromRect.height / 2
      const interpolation = 0.4
      const x = fromRect.left + (toX - fromRect.left) * interpolation
      const y = fromRect.top + (toY - fromRect.top) * interpolation
      node.style.setProperty('--drag-repeat-node-translate', `${x}px ${y}px`)
    })

    requestAnimationFrame(followRepeatedNodes)
  })()

  // Highlight container
  element.classList.add(DRAG_REORDER_CLASSNAME)
  const nodeId = dragInsertState.initialContainer.getAttribute('data-id')
  window.parent.postMessage(
    {
      type: 'highlight',
      highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
      exactHighlightedNodeId: nodeId,
    },
    '*',
  )

  setDropHighlight(
    dragInsertState.element,
    dragInsertState.initialContainer,
    dragInsertState.elementType === 'component' ? 'D946EF' : '2563EB',
  )

  return dragInsertState
}

export async function dragInsertEnded(
  dragInsertState: DragInsertState,
  canceled: boolean,
) {
  dragInsertState.destroying = true
  const selectedInsertArea =
    dragInsertState.insertAreas?.[dragInsertState.selectedInsertAreaIndex ?? -1]
  const siblings =
    (dragInsertState.mode === 'insert' && !canceled
      ? selectedInsertArea?.parent
      : dragInsertState.initialContainer
    )?.querySelectorAll('[data-id]') ?? []
  dragInsertState.element.style.setProperty(
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
  dragInsertState.repeatedNodes
    .filter(isElementInViewport)
    .forEach((node, i) => {
      node.style.setProperty(
        'view-transition-name',
        'dropped-item-repeated-' + i,
      )
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
      dragInsertState.copy?.remove()
      dragInsertState.initialContainer.insertBefore(
        dragInsertState.element,
        dragInsertState.initialNextSibling,
      )
    } else if (dragInsertState.mode === 'insert') {
      selectedInsertArea?.parent.insertBefore(
        dragInsertState.element,
        selectedInsertArea.parent.childNodes[selectedInsertArea.index],
      )
    }

    dragInsertState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    dragInsertState.element.classList.remove(DRAG_MOVE_CLASSNAME)
    dragInsertState.element.style.removeProperty('translate')
    dragInsertState.repeatedNodes.toReversed().forEach((node) => {
      dragInsertState.element.insertAdjacentElement('afterend', node)
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
  dragInsertState.element.style.removeProperty('view-transition-name')
  siblings.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.removeProperty('view-transition-name')
    }
  })
}

export function dragInsertMove(
  action: 'drag' | 'insert',
  dragInsertState: DragInsertState | null,
  exclude: HTMLElement[],
) {
  if (!dragInsertState) {
    return
  }

  // If the drag operation was a reorder operation, we need to switch to insert mode and perform some one-time preparation
  if (dragInsertState.mode === 'reorder' || action === 'insert') {
    dragInsertState.mode = 'insert'
    dragInsertState.element.style.setProperty('display', 'none')
    // We only calculate insert locations when dragging outside the container to avoid unnecessary calculations
    dragInsertState.insertAreas ??= getInsertAreas().filter(
      (x) =>
        exclude.every((e) => !e?.contains(x.parent) && e !== x.parent) &&
        x.parent !== document.body,
    )
    dragInsertState.element.style.removeProperty('display')
    const translate =
      dragInsertState.element.style.getPropertyValue('translate')
    dragInsertState.element.style.setProperty('translate', '0')
    const rect = dragInsertState.element.getBoundingClientRect()
    document.body.appendChild(dragInsertState.element)
    dragInsertState.element.classList.add(DRAG_MOVE_CLASSNAME)
    dragInsertState.element.classList.remove(DRAG_REORDER_CLASSNAME)
    dragInsertState.element.style.setProperty(
      '--drag-mode--move-left',
      `${rect.left}px`,
    )
    dragInsertState.element.style.setProperty(
      '--drag-mode--move-top',
      `${rect.top}px`,
    )
    dragInsertState.element.style.setProperty(
      '--drag-mode--move-width',
      `${dragInsertState.initialRect.width}px`,
    )
    dragInsertState.element.style.setProperty('translate', translate)
  }
  dragInsertState.repeatedNodes.forEach((node, i) => {
    node.style.setProperty('--drag-repeat-node-opacity', i < 3 ? '0.2' : '0')
  })

  const lines = dragInsertState.insertAreas?.map((line) => {
    if (line.layout === 'block') {
      return {
        x1: line.center.x - line.size / 2,
        y1: line.center.y,
        x2: line.center.x + line.size / 2,
        y2: line.center.y,
      }
    } else {
      return {
        x1: line.center.x,
        y1: line.center.y - line.size / 2,
        x2: line.center.x,
        y2: line.center.y + line.size / 2,
      }
    }
  })
  const { nearestLine, projectionPoint } = findNearestLine(
    lines ?? [],
    dragInsertState.lastCursorPosition,
  )
  if (!nearestLine || !dragInsertState.insertAreas || !lines) {
    return
  }

  const insertArea = dragInsertState.insertAreas.at(lines.indexOf(nearestLine))
  if (insertArea) {
    dragInsertState.selectedInsertAreaIndex =
      dragInsertState.insertAreas?.indexOf(insertArea)
    const nodeId = insertArea.parent.getAttribute('data-id')
    window.parent?.postMessage(
      {
        type: 'highlight',
        highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
        exactHighlightedNodeId: nodeId,
      },
      '*',
    )
    setExternalDropHighlight({
      layout: insertArea.layout,
      center: insertArea.center,
      length: insertArea.size > 0 ? insertArea.size : 6,
      color: dragInsertState.elementType === 'component' ? 'D946EF' : '2563EB',
      projectionPoint,
    })
  } else {
    removeDropHighlight()
  }
}

/**
 * Semi-hacky way to determine if an element is a Toddle component by checking if it is a root node, but not the top-level root node (page).
 */
function elementIsComponent(element: Element) {
  return (
    element.getAttribute('data-node-id') === 'root' &&
    element.getAttribute('data-id') !== '0'
  )
}
