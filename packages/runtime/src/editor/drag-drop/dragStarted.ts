import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import type { DragState, Point } from '../types'
import { DRAG_MOVE_CLASSNAME } from './dragMove'
import { DRAG_REORDER_CLASSNAME } from './dragReorder'
import { setDropHighlight } from './dropHighlight'

export function dragStarted({
  element,
  lastCursorPosition,
  repeatedNodes,
  asCopy,
  initialContainer = element.parentElement as HTMLElement,
  initialNextSibling,
}: {
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

  const dragState: DragState = {
    destroying: false,
    elementType: elementIsComponent(element) ? 'component' : 'element',
    element,
    offset: lastCursorPosition,
    lastCursorPosition,
    initialContainer,
    initialNextSibling,
    initialRect: element.getBoundingClientRect(),
    reorderPermutations: [],
    isTransitioning: false,
    repeatedNodes,
    mode: 'reorder',
  }

  if (asCopy) {
    dragState.copy = element.cloneNode(true) as HTMLElement
    dragState.copy.style.setProperty('opacity', '0.5')
    dragState.copy.classList.remove(DRAG_REORDER_CLASSNAME)
    dragState.copy.classList.remove(DRAG_MOVE_CLASSNAME)
    dragState.initialContainer.insertBefore(
      dragState.copy,
      dragState.initialNextSibling,
    )
  }

  // Calculate all possible permutations, by iterating over all siblings of the targetContainer
  // and moving the draggedElement to before each sibling to calculate the rect and then
  // store it in the dragState.permutations array
  dragState.initialContainer.childNodes.forEach((sibling) => {
    if (
      sibling instanceof Element &&
      sibling.getAttribute('data-id') &&
      // Only first item of repeated nodes should be considered
      !sibling.getAttribute('data-id')?.endsWith(')') &&
      !sibling.hasAttribute('data-component') &&
      repeatedNodes.every((node) => node !== sibling)
    ) {
      dragState?.initialContainer.insertBefore(element, sibling)
      dragState?.reorderPermutations.push({
        nextSibling: sibling,
        rect: element.getBoundingClientRect(),
      })
    }
  })
  // Test the last position
  if (!dragState.initialContainer.hasAttribute('data-component')) {
    dragState.initialContainer.appendChild(element)
    dragState?.reorderPermutations.push({
      nextSibling: null,
      rect: element.getBoundingClientRect(),
    })
  }
  // Restore the initial position of the draggedElement
  dragState.initialContainer.insertBefore(element, dragState.initialNextSibling)
  ;(function followRepeatedNodes() {
    if (dragState.destroying || !dragState.element.isConnected) {
      return
    }

    const followRect = dragState.element.getBoundingClientRect()
    dragState.repeatedNodes.forEach((node) => {
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
  window.parent?.postMessage(
    {
      type: 'highlight',
      highlightedNodeId: stripNodeIdRepeatIndices(
        dragState.initialContainer.getAttribute('data-id'),
      ),
      exactHighlightedNodeId:
        dragState.initialContainer.getAttribute('data-id'),
    },
    '*',
  )

  setDropHighlight(
    dragState.element,
    dragState.initialContainer,
    dragState.elementType === 'component' ? 'D946EF' : '2563EB',
  )

  return dragState
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
