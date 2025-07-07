import type {
  Component,
  StyleVariant,
} from '@nordcraft/core/dist/component/component.types'

export function omitSubnodeStyleForComponent<T extends Component | undefined>(
  component: T,
): T {
  const clone = structuredClone(component)
  Object.entries(clone?.nodes ?? {}).forEach(([nodeId, node]) => {
    if (
      (node.type === 'element' || node.type === 'component') &&
      nodeId !== 'root'
    ) {
      delete node.style
      delete node.animations
      node.variants = node.variants?.map(
        (variant) =>
          ({
            'style-variables': variant['style-variables'],
          }) as StyleVariant,
      )
    }
  })

  return clone
}
