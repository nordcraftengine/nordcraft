import type { Component } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'

/**
 * Modifies all link nodes on a component
 * NOTE: alters in place
 */
export const updateComponentLinks = (component: Component) => {
  // Find all links and add target="_blank" to them
  Object.entries(component.nodes ?? {}).forEach(([_, node]) => {
    if (node.type === 'element' && node.tag === 'a') {
      node.attrs['target'] = valueFormula('_blank')
    }
  })
  return component
}
