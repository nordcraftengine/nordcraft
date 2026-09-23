import { parseBorderOrOutline } from './parseBorderOrOutline'
import {
  checkIfNoUnknownVariables,
  getValue,
  parse,
  parseMultipleValues,
} from './shared'
import type {
  CSSStyleToken,
  ParsedBorderOutline,
  ParsedValueType,
} from './types'

export const getParsedOutline = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)
  if (
    style['outline-color'] ||
    style['outline-style'] ||
    style['outline-width'] ||
    style.outline
  ) {
    let parsedOutline: ParsedBorderOutline = {}
    const invalidValues: ParsedValueType[] = []
    const shorthandOutline: ParsedBorderOutline = {}

    if (style.outline) {
      const outline = parse({ input: style.outline })

      const values = getValue(outline[0])
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })

      if (allVariablesKnown) {
        // Go through all the values in the outline property
        allValues.forEach((val) => {
          const newProp = parseBorderOrOutline({
            valueToCheck: val,
            variables,
            property: 'outline',
          })
          if (newProp.invalidValue) {
            invalidValues.push(val)
          } else if (newProp.width) {
            shorthandOutline.width = newProp.width
          } else if (newProp.style) {
            shorthandOutline.style = newProp.style
          } else if (newProp.color) {
            shorthandOutline.color = newProp.color
          }
        })

        // We apply only if no invalid values
        if (invalidValues.length === 0) {
          parsedOutline = shorthandOutline
        }
      } else {
        // Parse the values by the order
        parsedOutline = {
          width: allValues[0],
          style: allValues[1],
          color: allValues[2],
        }
      }
    }
    if (
      style['outline-color'] &&
      (styleKeys.indexOf('outline-color') > styleKeys.indexOf('outline') ||
        invalidValues.length > 0)
    ) {
      const outlineColor = parse({ input: style['outline-color'] })
      const parsedOutlineColor = parseMultipleValues(
        getValue(outlineColor[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (parsedOutlineColor?.type === 'function' &&
          parsedOutlineColor.name === 'var') ||
        !style.outline
      ) {
        parsedOutline.color = parsedOutlineColor
      } else {
        // Check if it's a valid value
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedOutlineColor,
          variables,
          property: 'outline',
        })
        if (newProp.color) {
          parsedOutline.color = newProp.color
        }
      }
    }
    if (
      style['outline-style'] &&
      (styleKeys.indexOf('outline-style') > styleKeys.indexOf('outline') ||
        invalidValues.length > 0)
    ) {
      const outlineStyle = parse({ input: style['outline-style'] })
      const parsedOutlineStyle = parseMultipleValues(
        getValue(outlineStyle[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (parsedOutlineStyle?.type === 'function' &&
          parsedOutlineStyle.name === 'var') ||
        !style.outline
      ) {
        parsedOutline.style = parsedOutlineStyle
      } else {
        // Check if it's a valid value
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedOutlineStyle,
          variables,
          property: 'outline',
        })
        if (newProp.style) {
          parsedOutline.style = newProp.style
        }
      }
    }
    if (
      style['outline-width'] &&
      (styleKeys.indexOf('outline-width') > styleKeys.indexOf('outline') ||
        invalidValues.length > 0)
    ) {
      const outlineWidth = parse({ input: style['outline-width'] })
      const parsedOutlineWidth = parseMultipleValues(
        getValue(outlineWidth[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (parsedOutlineWidth?.type === 'function' &&
          parsedOutlineWidth.name === 'var') ||
        !style.outline
      ) {
        parsedOutline.width = parsedOutlineWidth
      } else {
        // Check if it's a valid value
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedOutlineWidth,
          variables,
          property: 'outline',
        })
        if (newProp.width) {
          parsedOutline.width = newProp.width
        }
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const outlineProperties = ['width', 'style', 'color'] as const

    const allPropertiesMissing = outlineProperties.every((item) => {
      return !(item in parsedOutline)
    })
    if (invalidValues.length > 0 && allPropertiesMissing) {
      parsedOutline = shorthandOutline

      outlineProperties.forEach((key) => {
        if (outlineProperties.includes(key) && !parsedOutline[key]) {
          parsedOutline[key] = invalidValues[0]
          invalidValues.shift()
        }
      })
    }
    return parsedOutline
  } else {
    return null
  }
}
