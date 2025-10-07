import type { NodeModel } from '@nordcraft/core/dist/component/component.types'
import type { Rule } from '../../../types'

export const unknownRepeatItemFormulaRule: Rule = {
  code: 'unknown repeat item formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path?.[0] !== 'ListItem' ||
      value.path?.[1] !== 'Item' ||
      path.length < 3 ||
      path[0] !== 'components' ||
      path[2] !== 'nodes'
    ) {
      return
    }
    const [_components, componentName, _nodes, nodeId] = path as string[]
    const component = files.components[componentName]
    if (!component) {
      return
    }
    const findParentWithRepeat = (
      args: [id: string, node: NodeModel] | undefined,
    ): NodeModel | undefined => {
      if (!args) {
        return
      }
      const [id, node] = args
      if (node.repeat) {
        return node
      }
      const parent = Object.entries(component.nodes).find(([_, node]) =>
        node.children?.includes(id),
      )
      return findParentWithRepeat(parent)
    }
    const node = component.nodes[nodeId]
    const parentWithRepeat = findParentWithRepeat([nodeId, node])
    if (!parentWithRepeat) {
      report(path)
    }
  },
}
