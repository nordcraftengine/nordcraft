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
 *
 * @param options - Options to control the behavior of the function
 *  - clearStyle: For pages, the classes are baked in so styles are not needed. For custom-elements and editor-preview, the styles are needed to be able to generate the classes and class hashes.
 * When clearStyle is false, the style is kept, but static custom properties are moved from custom properties to the style object. Dynamic custom properties are kept in the customProperties object for both cases.
 */
export const resolveClasses =
  (options = { clearStyle: true }) =>
  (component: Component) => ({
    ...component,
    nodes: mapObject<Nullable<NodeModel>, Nullable<NodeModel>>(
      component.nodes ?? {},
      ([key, node]) => {
        if (node?.type !== 'element' && node?.type !== 'component') {
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
          hasVariantCustomProperties ||=
            Object.keys(customProperties ?? {}).length > 0
          // For dynamic properties, we need details on the variant to be able to resolve them at runtime.
          return {
            ...variant,
            customProperties,
            style: options.clearStyle ? undefined : variant.style,
          }
        })

        return [
          key,
          {
            ...node,
            ...(node.type === 'element' && {
              classes:
                options.clearStyle && classHash !== undefined
                  ? {
                      ...node.classes,
                      [classHash]: { formula: valueFormula(true) },
                    }
                  : node.classes,
            }),
            style: options.clearStyle ? undefined : nodeStyle,
            customProperties: filterDynamicProperties(node.customProperties),
            variants:
              hasVariantCustomProperties || !options.clearStyle
                ? variants
                : undefined,
          },
        ] as [string, NodeModel]
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
