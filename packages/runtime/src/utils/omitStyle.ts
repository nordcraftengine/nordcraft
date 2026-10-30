import type { Component, StyleVariant } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

export function omitSubnodeStyleForComponent<T extends Component | undefined>(
  component: T,
): T {
  const clone = structuredClone(component)
  if (clone?.nodes) {
    for (const nodeId in clone.nodes) {
      const node = clone.nodes[nodeId]
      if (
        isDefined(node) &&
        (node.type === 'element' || node.type === 'component') &&
        nodeId !== 'root'
      ) {
        node.style = undefined
        node.animations = undefined
        node.variants = node.variants?.map(
          ({ customProperties }) =>
            ({
              customProperties,
            }) as StyleVariant,
        )
      }
    }
  }

  return clone
}
