import type { Component } from '@nordcraft/core/dist/component/component.types'

/**
 * Used to replace any recursive references to the root component, as it would be rendered both by toddle runtime
 * and by the custom element itself (which would cause an infinite loop)
 */
export const replaceTagInNodes =
  (oldTag: string, newTag: string) => (component: Component) => ({
    ...component,
    nodes: Object.entries(component.nodes ?? {}).reduce((acc, [key, node]) => {
      if (node.type !== 'element') {
        return {
          ...acc,
          [key]: node,
        }
      }

      return {
        ...acc,
        [key]: {
          ...node,
          tag: node.tag === oldTag ? newTag : node.tag,
        },
      }
    }, {}),
  })
