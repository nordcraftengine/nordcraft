import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import { get, omit, set } from '@nordcraft/core/dist/utils/collections'
import type { FixFunction, NodeType } from '../types'

export const removeFromPathFix: FixFunction<NodeType> = ({ path, files }) =>
  omit(files, path)

/**
 * Same as removeFromPathFix, but also removes the node from its parent's children.
 */
export const removeNodeFromPathFix: FixFunction<NodeType> = (data) => {
  if (data.nodeType !== 'component-node') {
    throw new Error('removeNodeFromPathFix can only be used on component nodes')
  }

  const componentNodesPath = data.path.slice(0, -1).map(String)
  const filesWithoutNode = removeFromPathFix(data)
  const nodes = get(filesWithoutNode, componentNodesPath) as Record<
    string,
    NodeModel
  >
  for (const key in nodes) {
    if (
      nodes[key].children?.includes(data.path[data.path.length - 1] as string)
    ) {
      nodes[key].children = nodes[key].children.filter(
        (p) => p !== data.path[data.path.length - 1],
      )
    }
  }

  return set(filesWithoutNode, componentNodesPath, nodes)
}
