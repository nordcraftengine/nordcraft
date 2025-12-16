import type {
  Component,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'

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
  const path = id.split('.')
  const pathParsed = path.map((n) => parseInt(n))
  const ancestors: NodeWithNodeId[] = []
  // nodePath skips the root element as it's selected as the initial
  // value in the reduce below
  const nodePath = pathParsed.slice(1)
  const node = nodePath.reduce((node: NodeModel | undefined, childIndex, i) => {
    switch (node?.type) {
      // 'text' elements don't have any children
      case 'element':
      case 'component':
      case 'slot':
        // Ancestors are elements before the target node
        if (i <= nodePath.length - 1) {
          ancestors.push({
            ...node,
            // Use the original path as origin to get correct nodeIds
            nodeId: path.slice(0, i + 1).join('.'),
          })
        }
        return component.nodes?.[node.children[childIndex]]
      default:
        return undefined
    }
  }, root)
  if (node === undefined) {
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
  const pathParts = path.split('.')
  const lastPathPart = pathParts.slice(-1)[0]
  const index = parseInt(lastPathPart)
  const repeatIndex = parseInt(String(lastPathPart.split('(')[1]))

  // Find the first child that either has a higher index or a similar index, but higher repeat index
  for (const child of parentElement.children) {
    const childPath = child.getAttribute('data-id')
    const lastChildPathPart = childPath?.split('.').slice(-1)[0]
    const childIndex = parseInt(String(lastChildPathPart))
    if (
      childIndex === index &&
      parseInt(String(lastChildPathPart?.split('(')[1])) > repeatIndex
    ) {
      return child
    }

    if (childIndex > index) {
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
      parentElement.insertBefore(item, insertBeforeElement)
    }

    // Update insertBeforeElement to the current item for the next iteration, as we need to insert subsequent items before this one.
    insertBeforeElement = item
  }
}
