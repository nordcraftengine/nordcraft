/* eslint-disable no-console */
import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { pathToString, stringToPath } from '@nordcraft/core/dist/utils/path'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { PATH } from '../constants'
import type { Path } from '../types'

type NodeWithNodeId = NodeModel & { nodeId: string }

interface NodeAndAncestorLookup {
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
  const path = stringToPath(id)
  const ancestors: NodeWithNodeId[] = []
  // nodePath skips the root element as it's selected as the initial
  // value in the reduce below
  const nodePath = path.slice(1)
  const node = nodePath.reduce(
    (node: NodeModel | undefined | null, pathElement, i) => {
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
              nodeId: pathToString(path.slice(0, i + 1)),
            })
          }
          const index = node.children?.[pathElement.index]
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
  path: Path,
  parentElement: Element | ShadowRoot,
): Node | null => {
  const lastPathPart = path[path.length - 1]
  const index = lastPathPart.index
  const repeatIndex = lastPathPart.repeatIndex ?? 0

  // Find the first child that either has a higher index or a similar index, but higher repeat index
  for (const child of parentElement.childNodes) {
    const childPath = child[PATH]
    if (!childPath || !Array.isArray(childPath)) {
      continue
    }
    const lastChildPathPart = childPath[childPath.length - 1]
    const childIndex = lastChildPathPart.index

    if (childIndex === index) {
      const childRepeatIndex = lastChildPathPart.repeatIndex ?? 0
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
  items: ReadonlyArray<Node>,
  nextElement: Node | null = null,
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
      if (
        item.parentNode === parentElement &&
        'moveBefore' in Element.prototype
      ) {
        // `moveBefore` is not yet supported in Safari and some older browsers,
        // moveBefore actually moves the element in the DOM instead of removing and reinserting it, which is more efficient and preserves animation-, transition- and focus states.
        parentElement.moveBefore(item, insertBeforeElement)
      } else {
        parentElement.insertBefore(item, insertBeforeElement)
      }
    }

    // Update insertBeforeElement to the current item for the next iteration, as we need to insert subsequent items before this one.
    insertBeforeElement = item
  }
}

export function stripNodeIdRepeatIndices(nodeId: string | null): string | null {
  if (!nodeId) {
    return null
  }

  return nodeId
    .split('.')
    .map((part) => part.split('(')[0].split('{')[0])
    .join('.')
}
