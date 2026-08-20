import { stripNodeIdRepeatIndices } from '../../utils/nodes'
import { setDropHighlight } from '../drag-drop/dropHighlight'
import type { InsertState, Point } from '../types'

export const INSERT_REORDER_CLASSNAME = '__drag-mode--reorder'

export function insertStarted({
  element,
  lastCursorPosition,
  repeatedNodes,
  initialContainer = element as HTMLElement,
  initialNextSibling,
}: {
  element: HTMLElement
  lastCursorPosition: Point
  repeatedNodes: HTMLElement[]
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

  const insertState: InsertState = {
    element,
    destroying: false,
    offset: lastCursorPosition,
    lastCursorPosition,
    initialContainer,
    initialNextSibling,
    initialRect: initialContainer.getBoundingClientRect(),
    reorderPermutations: [],
    repeatedNodes,
  }

  // Calculate all possible permutations, by iterating over all siblings of the targetContainer
  // and moving the draggedElement to before each sibling to calculate the rect and then
  // store it in the dragState.permutations array
  insertState.initialContainer.childNodes.forEach((sibling) => {
    if (
      sibling instanceof Element &&
      sibling.getAttribute('data-id') &&
      // Only first item of repeated nodes should be considered
      !sibling.getAttribute('data-id')?.endsWith(')') &&
      !sibling.hasAttribute('data-component') &&
      repeatedNodes.every((node) => node !== sibling)
    ) {
      insertState.initialContainer.insertBefore(element, sibling)
      insertState.reorderPermutations.push({
        nextSibling: sibling,
        rect: element.getBoundingClientRect(),
      })
    }
  })
  // Test the last position
  if (!insertState.initialContainer.hasAttribute('data-component')) {
    insertState.initialContainer.appendChild(element)
    insertState.reorderPermutations.push({
      nextSibling: null,
      rect: element.getBoundingClientRect(),
    })
  }
  // Restore the initial position of the draggedElement
  insertState.initialContainer.insertBefore(
    element,
    insertState.initialNextSibling,
  )
  ;(function followRepeatedNodes() {
    if (insertState.destroying || !insertState.element.isConnected) {
      return
    }

    const followRect = insertState.element.getBoundingClientRect()
    insertState.repeatedNodes.forEach((node) => {
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
  element.classList.add(INSERT_REORDER_CLASSNAME)
  const nodeId = insertState.initialContainer.getAttribute('data-id')
  window.parent.postMessage(
    {
      type: 'highlight',
      highlightedNodeId: stripNodeIdRepeatIndices(nodeId),
      exactHighlightedNodeId: nodeId,
    },
    '*',
  )

  setDropHighlight(insertState.element, insertState.initialContainer, '2563EB')

  return insertState
}
