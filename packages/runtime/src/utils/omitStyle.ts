import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { StyleVariant } from '@nordcraft/core/dist/styling/variantSelector'
import { isDefined } from '@nordcraft/core/dist/utils/util'

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
