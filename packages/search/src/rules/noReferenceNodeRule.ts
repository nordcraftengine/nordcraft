import type { Rule } from '../types'

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
    // We'll report the first unused node we find
    for (const key of Object.keys(component.nodes)) {
      if (key !== 'root' && !referencedNodes.has(key)) {
        report(path, { node: key })
        return
      }
    }
  },
}
