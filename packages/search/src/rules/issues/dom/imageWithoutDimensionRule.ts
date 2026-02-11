import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

const nonStaticDimensionKeywords = ['', 'auto']
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

    let hasValidWidth = false
    let hasValidHeight = false
    let hasValidAspectRatio = false

    if (isDefined(value.attrs.width)) {
      const widthEval = contextlessEvaluateFormula(value.attrs.width)
      // If dynamic, we assume it is valid
      hasValidWidth ||= !widthEval.isStatic || checkValue(widthEval.result)
    }

    if (isDefined(value.attrs.height)) {
      const heightEval = contextlessEvaluateFormula(value.attrs.height)
      // If dynamic, we assume it is valid
      hasValidHeight ||= !heightEval.isStatic || checkValue(heightEval.result)
    }

    ;[
      value.style,
      // We don't know the circumstances under which the style is applied, so we assume it is fine if just one of the variants has correct dimensions
      ...(value.variants?.map((variant) => variant.style) ?? []),
    ].forEach((style) => {
      hasValidWidth ||= checkValue(style?.width)
      hasValidHeight ||= checkValue(style?.height)
      hasValidAspectRatio ||= checkValue(style?.['aspect-ratio'])
    })

    // If two of the three values are truthy, the third can be derived
    if (
      [hasValidWidth, hasValidHeight, hasValidAspectRatio].filter(Boolean)
        .length >= 2
    ) {
      return
    }

    report({
      path,
      info: {
        title: 'Image dimension missing',
        description:
          '**Image elements** should have explicit width and height to prevent layout shifts.\n[Learn more](https://web.dev/articles/serve-images-with-correct-dimensions#avoid_layout_shifts_by_specifying_dimensions)',
      },
    })
  },
}

function checkValue(value: any | undefined): boolean {
  if (!isDefined(value)) {
    return false
  }

  if (nonStaticDimensionKeywords.includes(value)) {
    return false
  }

  return true
}
