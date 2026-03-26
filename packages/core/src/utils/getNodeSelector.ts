import { variantSelector, type StyleVariant } from '../styling/variantSelector'
import type { Nullable } from '../types'

type NodeSelectorOptions =
  | {
      componentName: string
      nodeId: Nullable<string>
      variant?: Nullable<StyleVariant>
    }
  | {
      componentName?: never
      nodeId?: never
      variant?: Nullable<StyleVariant>
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
  // Escape unescaped slashes in the path to avoid issues with CSS selector parsing
  selector = selector.replace(/(^|[^\\])\//g, '$1\\/')
  if (variant) {
    selector += variantSelector(variant)
  }

  return selector
}
