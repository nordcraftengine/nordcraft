import { getParsedBackground } from './background/parseBackground'
import { getParsedBoxShadow } from './box-shadow/parseBoxShadow'
import { getParsedAnimation } from './parseAnimation'
import { getParsedBorder } from './parseBorder'
import { getParsedBorderRadius } from './parseBorderRadius'
import { getParsedFlex } from './parseFlex'
import { getParsedFont } from './parseFont'
import { getParsedGap } from './parseGap'
import { getParsedOutline } from './parseOutline'
import { getParsedOverflow } from './parseOverflow'
import { getParsedTextDecoration } from './parseTextDecoration'
import { getParsedTransition } from './parseTransition'
import { getValue, parse, parseMultipleValues } from './shared'
import { getParsedTextShadow } from './text-shadow/parseTextShadow'
import { parsePerspective } from './transforms/parsePerspective'
import { getParsedRotate } from './transforms/parseRotate'
import { parseScale } from './transforms/parseScale'
import { parseTransform } from './transforms/parseTransform'
import { parseTranslate } from './transforms/parseTranslate'
import type { ParsedStyle, ThemeVariables } from './types'

export const parseCss = (args: {
  variables?: ThemeVariables
  style: Record<string, any>
}) => {
  const variables = args.variables
    ? Object.values(args.variables).flatMap((v) => v)
    : []

  if (args.style.constructor !== Object) {
    return console.error('The value you provided is not valid!')
  }

  let cssText = ''
  Object.entries(args.style).map(([key, value]) => {
    cssText += `${key}: ${value}; `
  })

  // We want to sort the style so the properties with the value !important comes at the end.
  const sortedStyleArray = Object.entries(args.style).toSorted((a, b) => {
    if (a[1].toString().includes('!important')) {
      return 1
    }
    if (b[1].toString().includes('!important')) {
      return -1
    } else {
      return 0
    }
  })

  const sortedStyle = Object.fromEntries(sortedStyleArray)

  const element = document.createElement('div')
  element.style = cssText

  const style: CSSStyleDeclaration = element.style

  const parsedStyle: ParsedStyle = {}

  // Background
  parsedStyle.background = getParsedBackground(sortedStyle, variables)

  // Transition
  parsedStyle.transition = getParsedTransition(sortedStyle, variables)

  // Animation
  parsedStyle.animation = getParsedAnimation(sortedStyle, variables)

  // Box shadow
  parsedStyle.boxShadow = getParsedBoxShadow(sortedStyle, variables)

  // Text shadow
  parsedStyle.textShadow = getParsedTextShadow(sortedStyle, variables)

  // Margin
  if (
    style.marginTop !== '' ||
    style.marginRight !== '' ||
    style.marginBottom !== '' ||
    style.marginLeft !== ''
  ) {
    const marginTop = parse({ input: style.marginTop })
    const marginRight = parse({ input: style.marginRight })
    const marginBottom = parse({ input: style.marginBottom })
    const marginLeft = parse({ input: style.marginLeft })

    parsedStyle.margin = {
      left: parseMultipleValues(getValue(marginLeft[0]))[0] ?? null,
      right: parseMultipleValues(getValue(marginRight[0]))[0] ?? null,
      top: parseMultipleValues(getValue(marginTop[0]))[0] ?? null,
      bottom: parseMultipleValues(getValue(marginBottom[0]))[0] ?? null,
    }
  } else {
    if (style.margin !== '') {
      const margin = parse({ input: style.margin })
      const marginValues = parseMultipleValues(getValue(margin[0]))

      parsedStyle.margin = {
        top: marginValues[0] ?? null,
        right: marginValues[1] ?? marginValues[0] ?? null,
        bottom: marginValues[2] ?? marginValues[0] ?? null,
        left: marginValues[3] ?? marginValues[1] ?? marginValues[0] ?? null,
      }
    } else {
      parsedStyle.margin = null
    }
  }

  // Padding
  if (
    style.paddingTop !== '' ||
    style.paddingRight !== '' ||
    style.paddingBottom !== '' ||
    style.paddingLeft !== ''
  ) {
    const paddingTop = parse({ input: style.paddingTop })
    const paddingRight = parse({ input: style.paddingRight })
    const paddingBottom = parse({ input: style.paddingBottom })
    const paddingLeft = parse({ input: style.paddingLeft })

    parsedStyle.padding = {
      left: parseMultipleValues(getValue(paddingLeft[0]))[0] ?? null,
      right: parseMultipleValues(getValue(paddingRight[0]))[0] ?? null,
      top: parseMultipleValues(getValue(paddingTop[0]))[0] ?? null,
      bottom: parseMultipleValues(getValue(paddingBottom[0]))[0] ?? null,
    }
  } else {
    if (style.padding !== '') {
      const padding = parse({ input: style.padding })
      const paddingValues = parseMultipleValues(getValue(padding[0]))

      parsedStyle.padding = {
        top: paddingValues[0] ?? null,
        right: paddingValues[1] ?? paddingValues[0] ?? null,
        bottom: paddingValues[2] ?? paddingValues[0] ?? null,
        left: paddingValues[3] ?? paddingValues[1] ?? paddingValues[0] ?? null,
      }
    } else {
      parsedStyle.padding = null
    }
  }

  // Translate
  parsedStyle.translate = parseTranslate(sortedStyle)

  // Rotate
  parsedStyle.rotate = getParsedRotate(sortedStyle, variables)

  // Scale
  parsedStyle.scale = parseScale(sortedStyle)

  // Perspective
  parsedStyle.perspective = parsePerspective(sortedStyle)

  // Transform
  parsedStyle.transform = parseTransform(sortedStyle)

  // Inset
  if (
    sortedStyle.top ||
    sortedStyle.bottom ||
    sortedStyle.left ||
    sortedStyle.right
  ) {
    const top = parse({ input: sortedStyle.top })
    const bottom = parse({ input: sortedStyle.bottom })
    const left = parse({ input: sortedStyle.left })
    const right = parse({ input: sortedStyle.right })

    parsedStyle.inset = {
      top: top ? (parseMultipleValues(getValue(top[0]))[0] ?? null) : null,
      bottom: bottom
        ? (parseMultipleValues(getValue(bottom[0]))[0] ?? null)
        : null,
      left: left ? (parseMultipleValues(getValue(left[0]))[0] ?? null) : null,
      right: right
        ? (parseMultipleValues(getValue(right[0]))[0] ?? null)
        : null,
    }
  } else {
    if (sortedStyle.inset) {
      const inset = parse({ input: sortedStyle.inset })
      const insetValues = parseMultipleValues(getValue(inset?.[0]))

      parsedStyle.inset = {
        top: insetValues[0] ?? null,
        right: insetValues[1] ?? insetValues[0] ?? null,
        bottom: insetValues[2] ?? insetValues[0] ?? null,
        left: insetValues[3] ?? insetValues[1] ?? insetValues[0] ?? null,
      }
    } else {
      parsedStyle.inset = null
    }
  }

  // Overflow
  parsedStyle.overflow = getParsedOverflow(sortedStyle)

  // Outline
  parsedStyle.outline = getParsedOutline(sortedStyle, variables)

  // Border
  parsedStyle.border = getParsedBorder(sortedStyle, variables)

  // Border radius
  parsedStyle.borderRadius = getParsedBorderRadius(sortedStyle, variables)

  // Font
  parsedStyle.font = getParsedFont(sortedStyle, variables)

  // Flex
  parsedStyle.flex = getParsedFlex(sortedStyle, variables)

  // Gap
  parsedStyle.gap = getParsedGap(sortedStyle)

  // Text decoration
  parsedStyle.textDecoration = getParsedTextDecoration(sortedStyle, variables)

  if (sortedStyle['color']) {
    const color = parse({ input: sortedStyle['color'] })
    parsedStyle.color = parseMultipleValues(getValue(color[0]))[0] ?? null
  } else {
    parsedStyle.color = null
  }

  return parsedStyle
}
