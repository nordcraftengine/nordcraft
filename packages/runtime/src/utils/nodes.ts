import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'

const CAN_MOVE = typeof (document.body as any).moveBefore === 'function'

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

/**
 * @returns The next sibling element or null if this is the last element. A nc sibling is a sibling with a higher index or the same index but a higher repeat index.
 */
export const getNextSiblingElement = (
  path: string,
  parentElement: Element | ShadowRoot,
) => {
  // Parse `path` without allocating intermediate arrays:
  // path format is e.g. "0.3.12" or "0.3(5).12(7)"
  const lastDot = path.lastIndexOf('.')
  const lastPathPart = lastDot === -1 ? path : path.slice(lastDot + 1)
  const parenIndex = lastPathPart.indexOf('(')
  const index =
    parenIndex === -1
      ? parseInt(lastPathPart)
      : parseInt(lastPathPart.slice(0, parenIndex))
  const repeatIndex =
    parenIndex === -1 ? NaN : parseInt(lastPathPart.slice(parenIndex + 1))

  // Indexed loop over HTMLCollection avoids iterator allocation from `for..of`
  const children = parentElement.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!
    const childPath = child.getAttribute('data-id')
    if (childPath === null) {
      continue
    }
    const childLastDot = childPath.lastIndexOf('.')
    const lastChildPathPart =
      childLastDot === -1 ? childPath : childPath.slice(childLastDot + 1)
    const childParenIndex = lastChildPathPart.indexOf('(')
    const childIndex =
      childParenIndex === -1
        ? parseInt(lastChildPathPart)
        : parseInt(lastChildPathPart.slice(0, childParenIndex))
    if (childIndex === index) {
      if (
        childParenIndex !== -1 &&
        parseInt(lastChildPathPart.slice(childParenIndex + 1)) > repeatIndex
      ) {
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

  // We'll process the items array in reverse order to minimize the number of DOM operations.
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]

    // Check if the item is already in the correct position by comparing it with the currentMarker.
    if (item === currentMarker) {
      // The item is in the correct position, move the marker to the previous sibling.
      currentMarker = item.previousSibling
    } else {
      // The item is either not in the DOM or not in the correct position.
      // Insert the item before the insertBeforeElement (or append it if insertBeforeElement is null).
      if (CAN_MOVE) {
        parentElement.moveBefore(item, insertBeforeElement)
      } else {
        parentElement.insertBefore(item, insertBeforeElement)
      }
    }

    // Update insertBeforeElement to the current item for the next iteration, as we need to insert subsequent items before this one.
    insertBeforeElement = item
  }
}
