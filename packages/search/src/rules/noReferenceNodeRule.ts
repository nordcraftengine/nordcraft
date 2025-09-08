import type { Rule } from '../types'
import { removeFromPathFix } from '../util/removeUnused.fix'

export const noReferenceNodeRule: Rule<{ node: string }> = {
  code: 'no-reference node',
  level: 'warning',
  category: 'No References',
  visit: (report, args) => {
    if (args.nodeType !== 'component') {
      return
    }
    const { path, value: component } = args
    const referencedNodes = new Set(
      Object.values(component.nodes).flatMap((node) => node.children ?? []),
    )
    for (const key of Object.keys(component.nodes)) {
      if (key !== 'root' && !referencedNodes.has(key)) {
        report([...path, 'nodes', key], { node: key }, ['delete orphan node'])
      }
    }
  },
  fixes: {
    'delete orphan node': removeFromPathFix,
  },
}

export type NoReferenceNodeRuleFix = 'delete orphan node'
