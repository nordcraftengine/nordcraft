import type { Component, NodeModel } from '../component/component.types'
import { valueFormula } from '../formula/formulaUtils'
import { mapObject } from '../utils/collections'
import { getClassName } from './className'

/**
 * Function to strip styles and variants from a Component's nodes and convert them to static class names
 */
export const serializeClasses = (component: Component) => ({
  ...component,
  nodes: mapObject<NodeModel, NodeModel>(
    component.nodes ?? {},
    ([key, node]) => {
      if (node.type !== 'element') {
        return [key, node]
      }
      // Convert style and variants to a class name
      let classHash: string | undefined
      if (node.style || node.variants) {
        classHash = getClassName([node.style, node.variants])
      }
      if (typeof classHash === 'string') {
        return [
          key,
          {
            ...node,
            classes: {
              ...node.classes,
              [classHash]: { formula: valueFormula(true) },
            },
            style: undefined,
            variants: undefined,
          },
        ]
      }
      return [key, node]
    },
  ),
})
