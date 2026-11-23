import type { Component, NodeModel } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

export type NodeWithNodeId = NodeModel & { nodeId: string }

export interface NodeAndAncestorLookup {
  node: NodeWithNodeId
  ancestors: NodeWithNodeId[]
}

export const getNodeAndAncestors = (
  component: Component,
  root: NodeModel,
  id: unknown,
): NodeAndAncestorLookup | undefined => {
  if (typeof id !== 'string' || id.length === 0) {
    return undefined
  }
  const path = id.split('.')
  const pathParsed = path.map((n) => parseInt(n))
  const ancestors: NodeWithNodeId[] = []
  // nodePath skips the root element as it's selected as the initial
  // value in the reduce below
  const nodePath = pathParsed.slice(1)
  const node = nodePath.reduce(
    (node: NodeModel | undefined | null, childIndex, i) => {
      switch (node?.type) {
        // 'text' elements don't have any children
        case 'element':
        case 'component':
        case 'slot': {
          // Ancestors are elements before the target node
          if (i <= nodePath.length - 1) {
            ancestors.push({
              ...node,
              // Use the original path as origin to get correct nodeIds
              nodeId: path.slice(0, i + 1).join('.'),
            })
          }
          const index = node.children?.[childIndex]
          if (index === undefined) {
            return undefined
          }
          return component.nodes?.[index]
        }
        default:
          return undefined
      }
    },
    root,
  )
  if (!isDefined(node)) {
    return undefined
  }
  return { node: { ...node, nodeId: id }, ancestors }
}

export const isNodeOrAncestorConditional = (
  nodeLookup?: NodeAndAncestorLookup,
): nodeLookup is NodeAndAncestorLookup =>
  nodeLookup?.node?.condition !== undefined ||
  nodeLookup?.ancestors.some((a) => a.condition !== undefined) === true

// TODO: This string parsing logic is ugly and error-prone. Consider storing the index and repeat index on the DOM elements directly or in a weak map.
/**
 * @returns The next sibling element or null if this is the last element. A nc sibling is a sibling with a higher index or the same index but a higher repeat index.
 */
export const getNextSiblingElement = (
  path: string,
  parentElement: Element | ShadowRoot,
  ignoreRepeat = false,
) => {
  const segmentStart = path.lastIndexOf('.') + 1
  const lastPathPart = segmentStart === 0 ? path : path.slice(segmentStart)
  const index = parseInt(lastPathPart, 10)
  const children = parentElement.children
  if (ignoreRepeat) {
    let nextSibling: Element | null = null
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      const childPath = child.getAttribute('data-id')
      if (childPath === null) continue
      const childIndex = parseInt(childPath.slice(segmentStart), 10)
      if (childIndex > index) {
        nextSibling = child
      } else if (childIndex <= index) {
        break
      }
    }
    return nextSibling
  }
  const parenIndex = lastPathPart.indexOf('(')
  const repeatIndex =
    parenIndex === -1 ? 0 : parseInt(lastPathPart.slice(parenIndex + 1), 10)

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const childPath = child.getAttribute('data-id')
    if (childPath === null) continue
    const lastChildPathPart = childPath.slice(segmentStart)
    const childIndex = parseInt(lastChildPathPart, 10)
    if (childIndex === index) {
      const childParenIndex = lastChildPathPart.indexOf('(')
      const childRepeatIndex =
        childParenIndex === -1
          ? 0
          : parseInt(lastChildPathPart.slice(childParenIndex + 1), 10)
      if (childRepeatIndex > repeatIndex) {
        return child
      }
    } else if (childIndex > index) {
      return child
    }
  }

  return null
}

/**
 * This function efficiently ensures that:
 * 1. New items are added in the correct position.
 * 2. Existing items are not moved if they are already in the correct order.
 */
export function ensureEfficientOrdering(
  parentElement: Element | ShadowRoot,
  items: ReadonlyArray<Element | Text>,
  nextElement: Element | Text | null = null,
) {
  // Identify the starting point for comparisons.
  let insertBeforeElement = nextElement // If insertBeforeElement is null, items will be appended at the end.

  // To track the current position in the DOM, we'll use a marker that advances through the sibling elements.
  let currentMarker = insertBeforeElement
    ? insertBeforeElement.previousSibling
    : parentElement.lastChild

  const canMoveBefore =
    typeof parentElement.moveBefore === 'function' && parentElement.isConnected

  // We'll process the items array in reverse order to minimize the number of DOM operations.
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]

    // Check if the item is already in the correct position by comparing it with the currentMarker.
    if (item === currentMarker) {
      // The item is in the correct position, move the marker to the previous sibling.
      currentMarker = item.previousSibling
    } else if (canMoveBefore && item.parentNode === parentElement) {
      // The item is already a child of parentElement, so move it atomically to preserve DOM state (e.g. CSS transitions).
      parentElement.moveBefore(item, insertBeforeElement)
    } else {
      // The item is either not in the DOM or not in the correct position.
      // Insert the item before the insertBeforeElement (or append it if insertBeforeElement is null).
      parentElement.insertBefore(item, insertBeforeElement)
    }

    // Update insertBeforeElement to the current item for the next iteration, as we need to insert subsequent items before this one.
    insertBeforeElement = item
  }
}
