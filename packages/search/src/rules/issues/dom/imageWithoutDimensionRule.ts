import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'

/**
 * Lighthouse reports a similar issue:
 * https://web.dev/articles/optimize-cls?utm_source=lighthouse&utm_medium=devtools#images_without_dimensions
 */
export const imageWithoutDimensionRule: Rule = {
  code: 'image without dimension',
  level: 'warning',
  category: 'Performance',
  visit: (report, { path, nodeType, value }) => {
    if (
      nodeType !== 'component-node' ||
      value.type !== 'element' ||
      !['img', 'source'].includes(value.tag)
    ) {
      return
    }

    // Aspect ratio can be calculated from width and height attributes
    if (isDefined(value.attrs.width) && isDefined(value.attrs.height)) {
      return
    }

    if (
      [
        value.style,
        // We don't know the circumstances under which the style is applied, so we assume it is Okay if just one of the variants has correct style
        ...(value.variants?.map((variant) => variant.style) ?? []),
      ].some((style) => {
        // Aspect ratio is not required if width and height are fixed
        if (isDefined(style.width) && isDefined(style.height)) {
          return true
        }

        // Aspect ratio is set explicitly
        if (isDefined(style['aspect-ratio'])) {
          return true
        }

        return false
      })
    ) {
      return
    }

    report(path)
  },
}
