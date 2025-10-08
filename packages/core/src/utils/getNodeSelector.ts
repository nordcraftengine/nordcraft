import { variantSelector, type StyleVariant } from '../styling/variantSelector'

type NodeSelectorOptions =
  | {
      componentName: string
      nodeId: string | undefined
      variant?: StyleVariant
    }
  | {
      componentName?: never
      nodeId?: never
      variant?: StyleVariant
    }

export function getNodeSelector(
  path: string,
  { componentName, nodeId, variant }: NodeSelectorOptions = {},
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
