import type {
  ComponentNodeModel,
  CustomProperty,
  ElementNodeModel,
  NodeStyleModel,
} from '../component/component.types'
import type { Nullable } from '../types'
import { appendUnit } from './customProperty'
import { generateAlphabeticName, hash } from './hash'
import type { StyleVariant } from './variantSelector'

// Classnames are reused a lot, and JS hashing is expensive, so there is benefit in caching them in a native hashmap.
const CLASSNAME_LOOKUP = new Map<string, string>()
export const getClassName = (
  object: [Nullable<NodeStyleModel>, Nullable<StyleVariant[]>],
) => {
  const stringified = JSON.stringify(
    object.filter(
      (item) =>
        item !== null && // Skip nullish values
        item !== undefined &&
        (Array.isArray(item) ? item.length > 0 : true) && // Skip empty arrays/objects
        (typeof item === 'object' ? Object.keys(item).length > 0 : true),
    ),
  )
  if (CLASSNAME_LOOKUP.has(stringified)) {
    return CLASSNAME_LOOKUP.get(stringified)!
  }
  const className = generateAlphabeticName(hash(stringified))
  CLASSNAME_LOOKUP.set(stringified, className)
  return className
}

const getStaticCustomPropertyStyles = (
  customProperties: Record<`--${string}`, CustomProperty> | undefined,
) =>
  Object.fromEntries(
    Object.entries(customProperties ?? {})
      .filter(([, value]) => value.formula?.type === 'value')
      .map(([key, value]) => [
        key,
        appendUnit(
          value.formula?.type === 'value' ? value.formula.value : undefined,
          value.unit,
        ),
      ]),
  )

const mergeStaticStyle = (
  style: NodeStyleModel | undefined | null,
  customProperties: Record<`--${string}`, CustomProperty> | undefined,
): Nullable<NodeStyleModel> => {
  const staticStyles = getStaticCustomPropertyStyles(customProperties)
  return Object.keys(staticStyles).length > 0 || style
    ? { ...style, ...staticStyles }
    : undefined
}

export const getStaticStyleAndVariants = (
  node: ElementNodeModel | ComponentNodeModel,
) =>
  [
    mergeStaticStyle(node.style, node.customProperties ?? {}),
    node.variants?.map(({ customProperties, ...rest }) => ({
      ...rest,
      style: mergeStaticStyle(rest.style, customProperties ?? {}),
    })),
  ] as [Nullable<NodeStyleModel>, Nullable<StyleVariant[]>]

export const toValidClassName = (
  input: string,
  escapeSpecialCharacters = false,
) => {
  // Replace invalid characters with hyphens
  let className = input
    // Remove leading and trailing whitespace
    .trim()
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')

  if (escapeSpecialCharacters) {
    className = className.replace(/[^a-zA-Z0-9-_]/g, (match) => `\\${match}`)
  }

  // Ensure the class name doesn't start with a number or special character
  if (/^[^a-zA-Z]/.test(className)) {
    className = `_${className}`
  }

  return className
}
