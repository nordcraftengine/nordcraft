import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { Nullable } from '@nordcraft/core/dist/types'

/**
 * Traverses upwards to build an ancestor array
 * for a node inside a component's flat node map.
 */
export function getNodeAncestorsContext(
  nodes: Nullable<Partial<Record<string, NodeModel | null>>>,
  targetNodeId: string,
): NodeModel[] {
  if (!nodes || !targetNodeId) {
    return []
  }
  const ancestors: NodeModel[] = []
  let currentId = targetNodeId
  let limit = 100
  while (currentId && limit-- > 0) {
    const parentId = currentId
    const parentEntry = Object.entries(nodes as any).find(
      ([_, n]) =>
        n &&
        Array.isArray((n as any).children) &&
        (n as any).children.includes(parentId),
    )
    if (parentEntry) {
      const [nextId, parentNode] = parentEntry as [string, any]
      ancestors.unshift(parentNode)
      currentId = nextId
    } else {
      break
    }
  }
  return ancestors
}

/**
 * Builds context for formulas or generic locations based on the node path.
 */
export function getFormulaPathContext(
  path: (string | number)[],
  files: any,
): string {
  // If the path is under a component
  if (path[0] === 'components' && typeof path[1] === 'string') {
    const componentName = path[1]
    const componentObj = files?.components?.[componentName]
    const nodes = componentObj?.nodes

    // Under nodes (elements/subcomponents)
    if (path[2] === 'nodes' && typeof path[3] === 'string') {
      const nodeId = path[3]
      const ancestors = getNodeAncestorsContext(nodes, nodeId)
      const mappedAncestors = ancestors
        .map((a) =>
          a.type === 'element'
            ? a.tag
            : a.type === 'component'
              ? a.name
              : '<unknown>',
        )
        .join(' > ')
      const ancestorsStr = mappedAncestors ? `${mappedAncestors} > ` : ''
      const node = nodes?.[nodeId]
      const nodeName = node
        ? node.type === 'element'
          ? node.tag
          : node.name
        : nodeId

      if (path[4] === 'attrs' && typeof path[5] === 'string') {
        return `${ancestorsStr}${nodeName} > ${path[5]} > `
      }
      if (path[4] === 'style' && typeof path[5] === 'string') {
        return `${ancestorsStr}${nodeName} > style > ${path[5]} > `
      }
      if (path[4] === 'variants' && typeof path[7] === 'string') {
        return `${ancestorsStr}${nodeName} > variant > ${path[7]} > `
      }
      return `${ancestorsStr}${nodeName} > `
    }

    // Under formulas
    if (path[2] === 'formulas' && typeof path[3] === 'string') {
      return `formulas > ${path[3]} > `
    }

    // Under workflows
    if (path[2] === 'workflows' && typeof path[3] === 'string') {
      return `workflows > ${path[3]} > `
    }

    // Under contexts
    if (path[2] === 'contexts' && typeof path[3] === 'string') {
      return `contexts > ${path[3]} > `
    }

    // Under variables
    if (path[2] === 'variables' && typeof path[3] === 'string') {
      return `variables > ${path[3]} > `
    }

    // Under apis
    if (path[2] === 'apis' && typeof path[3] === 'string') {
      return `apis > ${path[3]} > `
    }
  }

  // If path is root formulas
  if (path[0] === 'formulas' && typeof path[1] === 'string') {
    return `formulas > ${path[1]} > `
  }

  return ''
}
