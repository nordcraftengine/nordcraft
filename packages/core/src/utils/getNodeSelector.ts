import type { StyleVariant } from '../component/component.types'
import { variantSelector } from '../styling/variantSelector'

export function getNodeSelector(
  path: string,
  {
    componentName,
    nodeId,
    variant,
  }: {
    componentName?: string
    nodeId?: string
    variant?: StyleVariant
  } = {},
): string {
  let selector = `[data-id="${path}"]`
  if (componentName) {
    selector += `.${componentName}`
  }
  if (nodeId) {
    selector += `\\:${nodeId}`
  }
  if (variant) {
    selector += variantSelector(variant)
  }

  return selector
}
