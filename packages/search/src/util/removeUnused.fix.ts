import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import { get, omit, set } from '@nordcraft/core/dist/utils/collections'
import type { FixFunction, NodeType } from '../types'

export const removeFromPathFix: FixFunction<NodeType> = ({ path, files }) =>
  omit(files, path)

/**
 * Same as removeFromPathFix, but also cleans up any references to the removed node.
 */
export const removeNodeFromPathFix: FixFunction<NodeType> = (data) => {
  if (data.nodeType !== 'component-node') {
    throw new Error('removeNodeFromPathFix can only be used on component nodes')
  }

  const componentNodesPath = data.path.map(String)
  const nodeId = componentNodesPath.pop()!
  const nodes = { ...get(data.files, componentNodesPath) } as Record<
    string,
    NodeModel
  >

  // Clean parent reference
  for (const key in nodes) {
    if (nodes[key].children?.includes(nodeId)) {
      nodes[key].children = nodes[key].children.filter((p) => p !== nodeId)
    }
  }

  // Clean children recursively
  const removeNodeAndChildren = (nodeId: string) => {
    const node = nodes[nodeId] as NodeModel | undefined
    if (!node) {
      return
    }

    if (node.children) {
      for (const childId of node.children) {
        removeNodeAndChildren(childId)
      }
    }

    delete nodes[nodeId]
  }

  removeNodeAndChildren(nodeId)

  return set(data.files, componentNodesPath, nodes)
}
