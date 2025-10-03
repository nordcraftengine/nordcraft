import type { Rule } from '../../../types'
import { removeNodeFromPathFix } from '../../../util/removeUnused.fix'

export const noReferenceNodeRule: Rule<{ node: string }> = {
  code: 'no-reference node',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component-node') {
      return
    }
    const { path, component } = args
    const nodeId = path.at(-1)
    if (typeof nodeId !== 'string') {
      return
    }
    const referencedNodesInComponent = args.memo(
      `node-references-${component.name}`,
      () =>
        new Set(
          Object.values(component.nodes).flatMap((node) => node.children ?? []),
        ),
    )

    if (nodeId !== 'root' && !referencedNodesInComponent.has(nodeId)) {
      report(path, { node: nodeId }, ['delete-orphan-node'])
    }
  },
  fixes: {
    'delete-orphan-node': removeNodeFromPathFix,
  },
}

export type NoReferenceNodeRuleFix = 'delete-orphan-node'
