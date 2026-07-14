import type {
  Component,
  CustomProperty,
  NodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import {
  getClassName,
  getStaticStyleAndVariants,
} from '@nordcraft/core/dist/styling/className'
import type { Nullable } from '@nordcraft/core/dist/types'
import { mapObject } from '@nordcraft/core/dist/utils/collections'

/**
 * Function to strip styles and variants from a Component's nodes and convert them to static class names
 */
export const resolveClasses = (component: Component) => ({
  ...component,
  nodes: mapObject<Nullable<NodeModel>, Nullable<NodeModel>>(
    component.nodes ?? {},
    ([key, node]) => {
      if (node?.type !== 'element') {
        return [key, node]
      }

      const [nodeStyle, nodeVariants] = getStaticStyleAndVariants(node)
      const classHash =
        nodeStyle || nodeVariants
          ? getClassName([nodeStyle, nodeVariants])
          : undefined

      let hasVariantCustomProperties = false
      const variants = nodeVariants?.map((variant) => {
        const customProperties = filterDynamicProperties(
          variant.customProperties,
        )
        hasVariantCustomProperties ||= Object.keys(customProperties).length > 0
        // For dynamic properties, we need details on the variant to be able to resolve them at runtime.
        return { ...variant, customProperties, style: undefined }
      })

      return [
        key,
        {
          ...node,
          classes:
            classHash !== undefined
              ? {
                  ...node.classes,
                  [classHash]: { formula: valueFormula(true) },
                }
              : node.classes,
          style: undefined,
          customProperties: filterDynamicProperties(node.customProperties),
          variants: hasVariantCustomProperties ? variants : undefined,
        },
      ]
    },
  ),
})

function filterDynamicProperties(
  customProperties: Nullable<Record<`--${string}`, CustomProperty>>,
) {
  const dynamicCustomProperties: Record<`--${string}`, CustomProperty> = {}
  for (const [key, customProperty] of Object.entries(customProperties ?? {})) {
    if (customProperty.formula?.type !== 'value') {
      dynamicCustomProperties[key as `--${string}`] = customProperty
    }
  }
  return dynamicCustomProperties
}
