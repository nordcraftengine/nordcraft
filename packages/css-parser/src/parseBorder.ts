import { parseBorderOrOutline } from './parseBorderOrOutline'
import {
  checkIfNoUnknownVariables,
  getValue,
  parse,
  parseMultipleValues,
} from './shared'
import type {
  CSSStyleToken,
  NodeTypes,
  ParsedBorder,
  ParsedBorderOutline,
  ParsedValueType,
} from './types'

export const getParsedBorder = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)

  // Border
  if (
    style['border-width'] ||
    style['border-style'] ||
    style['border-color'] ||
    style['border-top-width'] ||
    style['border-top-style'] ||
    style['border-top-color'] ||
    style['border-bottom-width'] ||
    style['border-bottom-style'] ||
    style['border-bottom-color'] ||
    style['border-left-width'] ||
    style['border-left-style'] ||
    style['border-left-color'] ||
    style['border-right-width'] ||
    style['border-right-style'] ||
    style['border-right-color'] ||
    style['border-top'] ||
    style['border-bottom'] ||
    style['border-left'] ||
    style['border-right'] ||
    style.border
  ) {
    const border: ParsedBorder = {}

    const invalidValuesAll: ParsedValueType[] = []
    const invalidValuesLeft: ParsedValueType[] = []
    const invalidValuesRight: ParsedValueType[] = []
    const invalidValuesTop: ParsedValueType[] = []
    const invalidValuesBottom: ParsedValueType[] = []

    const shorthandBorderAll: ParsedBorderOutline = {}
    let shorthandBorderLeft: ParsedBorderOutline | null = {}
    let shorthandBorderRight: ParsedBorderOutline | null = {}
    let shorthandBorderTop: ParsedBorderOutline | null = null
    let shorthandBorderBottom: ParsedBorderOutline | null = {}

    if (style.border) {
      const parsedBorder = parse({ input: style.border, slashSplit: false })

      const values = getValue(parsedBorder[0])
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })

      border.all = {}

      if (allVariablesKnown) {
        // Go through all the values in the border
        allValues.forEach((val) => {
          const newProp = parseBorderOrOutline({
            valueToCheck: val,
            variables,
          })
          if (newProp.invalidValue) {
            invalidValuesAll.push(val)
          } else if (newProp.width) {
            shorthandBorderAll.width = newProp.width
          } else if (newProp.style) {
            shorthandBorderAll.style = newProp.style
          } else if (newProp.color) {
            shorthandBorderAll.color = newProp.color
          }
        })

        // We apply only if no invalid values
        if (invalidValuesAll.length === 0) {
          border.all = shorthandBorderAll
        }
      } else {
        // Parse the values by the order
        border.all = {
          width: allValues[0],
          style: allValues[1],
          color: allValues[2],
        }
      }
    }

    // Border top
    if (
      style['border-top'] &&
      (styleKeys.indexOf('border-top') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const parsedBorder = parse({
        input: style['border-top'],
        slashSplit: false,
      })

      const borderTop = getBorder({
        parsedBorder,
        styleKeys,
        variables,
        borderSide: 'border-top',
      })
      invalidValuesTop.push(...borderTop.invalidValues)
      shorthandBorderTop = borderTop.shorthandBorder

      if (shorthandBorderTop) {
        // We apply only if no invalid values
        if (invalidValuesTop.length === 0) {
          if (!border.top) {
            border.top = {}
          }
          if (shorthandBorderTop.width || border.top.width) {
            border.top.width = shorthandBorderTop.width ?? border.top.width
          }
          if (shorthandBorderTop.style || border.top.style) {
            border.top.style = shorthandBorderTop.style ?? border.top.style
          }
          if (shorthandBorderTop.color || border.top.color) {
            border.top.color = shorthandBorderTop.color ?? border.top.color
          }
        }
      }
    }
    if (
      style['border-top-width'] &&
      (styleKeys.indexOf('border-top-width') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-top-width') >
        styleKeys.indexOf('border-width') &&
      styleKeys.indexOf('border-top-width') > styleKeys.indexOf('border-top')
    ) {
      if (!border.top) {
        border.top = {}
      }
      const borderTopWidth = parse({ input: style['border-top-width'] })

      border.top.width = parseMultipleValues(getValue(borderTopWidth[0]))[0]
    }
    if (
      style['border-top-style'] &&
      (styleKeys.indexOf('border-top-style') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-top-style') >
        styleKeys.indexOf('border-style') &&
      styleKeys.indexOf('border-top-style') > styleKeys.indexOf('border-top')
    ) {
      if (!border.top) {
        border.top = {}
      }
      const borderTopStyle = parse({ input: style['border-top-style'] })

      border.top.style = parseMultipleValues(getValue(borderTopStyle[0]))[0]
    }
    if (
      style['border-top-color'] &&
      (styleKeys.indexOf('border-top-color') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-top-color') >
        styleKeys.indexOf('border-color') &&
      styleKeys.indexOf('border-top-color') > styleKeys.indexOf('border-top')
    ) {
      if (!border.top) {
        border.top = {}
      }
      const borderTopColor = parse({ input: style['border-top-color'] })

      border.top.color = parseMultipleValues(getValue(borderTopColor[0]))[0]
    }

    // Border bottom
    if (
      style['border-bottom'] &&
      (styleKeys.indexOf('border-bottom') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const parsedBorder = parse({
        input: style['border-bottom'],
        slashSplit: false,
      })

      const borderBottom = getBorder({
        parsedBorder,
        styleKeys,
        variables,
        borderSide: 'border-bottom',
      })

      invalidValuesBottom.push(...borderBottom.invalidValues)
      shorthandBorderBottom = borderBottom.shorthandBorder

      if (shorthandBorderBottom) {
        // We apply only if no invalid values
        if (invalidValuesBottom.length === 0) {
          if (!border.bottom) {
            border.bottom = {}
          }
          if (shorthandBorderBottom.width || border.bottom.width) {
            border.bottom.width =
              shorthandBorderBottom.width ?? border.bottom.width
          }
          if (shorthandBorderBottom.style || border.bottom.style) {
            border.bottom.style =
              shorthandBorderBottom.style ?? border.bottom.style
          }
          if (shorthandBorderBottom.color || border.bottom.color) {
            border.bottom.color =
              shorthandBorderBottom.color ?? border.bottom.color
          }
        }
      }
    }
    if (
      style['border-bottom-width'] &&
      (styleKeys.indexOf('border-bottom-width') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-bottom-width') >
        styleKeys.indexOf('border-width') &&
      styleKeys.indexOf('border-bottom-width') >
        styleKeys.indexOf('border-bottom')
    ) {
      if (!border.bottom) {
        border.bottom = {}
      }
      const borderBottomWidth = parse({ input: style['border-bottom-width'] })

      border.bottom.width = parseMultipleValues(
        getValue(borderBottomWidth[0]),
      )[0]
    }
    if (
      style['border-bottom-style'] &&
      (styleKeys.indexOf('border-bottom-style') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-bottom-style') >
        styleKeys.indexOf('border-style') &&
      styleKeys.indexOf('border-bottom-style') >
        styleKeys.indexOf('border-bottom')
    ) {
      if (!border.bottom) {
        border.bottom = {}
      }
      const borderBottomStyle = parse({ input: style['border-bottom-style'] })

      border.bottom.style = parseMultipleValues(
        getValue(borderBottomStyle[0]),
      )[0]
    }
    if (
      style['border-bottom-color'] &&
      (styleKeys.indexOf('border-bottom-color') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-bottom-color') >
        styleKeys.indexOf('border-color') &&
      styleKeys.indexOf('border-bottom-color') >
        styleKeys.indexOf('border-bottom')
    ) {
      if (!border.bottom) {
        border.bottom = {}
      }
      const borderBottomColor = parse({ input: style['border-bottom-color'] })

      border.bottom.color = parseMultipleValues(
        getValue(borderBottomColor[0]),
      )[0]
    }

    // Border left
    if (
      style['border-left'] &&
      (styleKeys.indexOf('border-left') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const parsedBorder = parse({ input: style['border-left'] })

      const borderLeft = getBorder({
        parsedBorder,
        styleKeys,
        variables,
        borderSide: 'border-left',
      })

      invalidValuesLeft.push(...borderLeft.invalidValues)
      shorthandBorderLeft = borderLeft.shorthandBorder

      if (shorthandBorderLeft) {
        // We apply only if no invalid values
        if (invalidValuesLeft.length === 0) {
          if (!border.left) {
            border.left = {}
          }
          if (shorthandBorderLeft.width || border.left.width) {
            border.left.width = shorthandBorderLeft.width ?? border.left.width
          }
          if (shorthandBorderLeft.style || border.left.style) {
            border.left.style = shorthandBorderLeft.style ?? border.left.style
          }
          if (shorthandBorderLeft.color || border.left.color) {
            border.left.color = shorthandBorderLeft.color ?? border.left.color
          }
        }
      }
    }
    if (
      style['border-left-width'] &&
      (styleKeys.indexOf('border-left-width') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-left-width') >
        styleKeys.indexOf('border-width') &&
      styleKeys.indexOf('border-left-width') > styleKeys.indexOf('border-left')
    ) {
      if (!border.left) {
        border.left = {}
      }
      const borderLeftWidth = parse({ input: style['border-left-width'] })

      border.left.width = parseMultipleValues(getValue(borderLeftWidth[0]))[0]
    }
    if (
      style['border-left-style'] &&
      (styleKeys.indexOf('border-left-style') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-left-style') >
        styleKeys.indexOf('border-style') &&
      styleKeys.indexOf('border-left-style') > styleKeys.indexOf('border-left')
    ) {
      if (!border.left) {
        border.left = {}
      }
      const borderLeftStyle = parse({ input: style['border-left-style'] })

      border.left.style = parseMultipleValues(getValue(borderLeftStyle[0]))[0]
    }
    if (
      style['border-left-color'] &&
      (styleKeys.indexOf('border-left-color') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-left-color') >
        styleKeys.indexOf('border-color') &&
      styleKeys.indexOf('border-left-color') > styleKeys.indexOf('border-left')
    ) {
      if (!border.left) {
        border.left = {}
      }

      const borderLeftColor = parse({ input: style['border-left-color'] })

      border.left.color = parseMultipleValues(getValue(borderLeftColor[0]))[0]
    }

    // Border right
    if (
      style['border-right'] &&
      (styleKeys.indexOf('border-right') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const parsedBorder = parse({ input: style['border-right'] })

      const borderRight = getBorder({
        parsedBorder,
        styleKeys,
        variables,
        borderSide: 'border-right',
      })

      invalidValuesRight.push(...borderRight.invalidValues)
      shorthandBorderRight = borderRight.shorthandBorder

      if (shorthandBorderRight) {
        if (invalidValuesRight.length === 0) {
          if (!border.right) {
            border.right = {}
          }
          if (shorthandBorderRight.width || border.right.width) {
            border.right.width =
              shorthandBorderRight.width ?? border.right.width
          }
          if (shorthandBorderRight.style || border.right.style) {
            border.right.style =
              shorthandBorderRight.style ?? border.right.style
          }
          if (shorthandBorderRight.color || border.right.color) {
            border.right.color =
              shorthandBorderRight.color ?? border.right.color
          }
        }
      }
    }
    if (
      style['border-right-width'] &&
      (styleKeys.indexOf('border-right-width') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-right-width') >
        styleKeys.indexOf('border-width') &&
      styleKeys.indexOf('border-right-width') >
        styleKeys.indexOf('border-right')
    ) {
      if (!border.right) {
        border.right = {}
      }
      const borderRightWidth = parse({ input: style['border-right-width'] })

      border.right.width = parseMultipleValues(getValue(borderRightWidth[0]))[0]
    }
    if (
      style['border-right-style'] &&
      (styleKeys.indexOf('border-right-style') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-right-style') >
        styleKeys.indexOf('border-style') &&
      styleKeys.indexOf('border-right-style') >
        styleKeys.indexOf('border-right')
    ) {
      if (!border.right) {
        border.right = {}
      }
      const borderRightStyle = parse({ input: style['border-right-style'] })

      border.right.style = parseMultipleValues(getValue(borderRightStyle[0]))[0]
    }
    if (
      style['border-right-color'] &&
      (styleKeys.indexOf('border-right-color') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0) &&
      styleKeys.indexOf('border-right-color') >
        styleKeys.indexOf('border-color') &&
      styleKeys.indexOf('border-right-color') >
        styleKeys.indexOf('border-right')
    ) {
      if (!border.right) {
        border.right = {}
      }
      const borderRightColor = parse({ input: style['border-right-color'] })

      border.right.color = parseMultipleValues(getValue(borderRightColor[0]))[0]
    }

    // Border width
    if (
      style['border-width'] &&
      (styleKeys.indexOf('border-width') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const borderWidth = parse({ input: style['border-width'] })
      const borderWidthValue = getValue(borderWidth[0])
      const parsedBorderWidth = parseMultipleValues(borderWidthValue)

      if (parsedBorderWidth.length === 1) {
        if (!border.all) {
          border.all = {}
        }
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedBorderWidth[0],
          variables,
        })
        if (newProp.width) {
          border.all.width = newProp.width
        }

        // Apply to the single ones only if they are defined in the style
        if (
          border.top &&
          styleKeys.indexOf('border-width') >
            styleKeys.indexOf('border-top-width') &&
          styleKeys.indexOf('border-width') > styleKeys.indexOf('border-top')
        ) {
          border.top.width = newProp.width
        }
        if (
          border.bottom &&
          styleKeys.indexOf('border-width') >
            styleKeys.indexOf('border-bottom-width') &&
          styleKeys.indexOf('border-width') > styleKeys.indexOf('border-bottom')
        ) {
          border.bottom.width = newProp.width
        }
        if (
          border.left &&
          styleKeys.indexOf('border-width') >
            styleKeys.indexOf('border-left-width') &&
          styleKeys.indexOf('border-width') > styleKeys.indexOf('border-left')
        ) {
          border.left.width = newProp.width
        }
        if (
          border.right &&
          styleKeys.indexOf('border-width') >
            styleKeys.indexOf('border-right-width') &&
          styleKeys.indexOf('border-width') > styleKeys.indexOf('border-right')
        ) {
          border.right.width = newProp.width
        }
      } else {
        if (!border.top) {
          border.top = {}
        }
        if (!border.bottom) {
          border.bottom = {}
        }
        if (!border.left) {
          border.left = {}
        }
        if (!border.right) {
          border.right = {}
        }
        parsedBorderWidth.forEach((value, index: number) => {
          const newProp = parseBorderOrOutline({
            valueToCheck: value,
            variables,
          })
          if (newProp.width) {
            if (index === 0) {
              border.top = { ...border.top, width: newProp.width }
              border.bottom = { ...border.bottom, width: newProp.width }
            } else if (index === 1) {
              border.left = { ...border.left, width: newProp.width }
              border.right = { ...border.right, width: newProp.width }
            } else if (index === 2) {
              border.bottom = { ...border.bottom, width: newProp.width }
            } else {
              border.left = { ...border.left, width: newProp.width }
            }
          }
        })
      }
    }

    // Border style
    if (
      style['border-style'] &&
      (styleKeys.indexOf('border-style') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const borderStyle = parse({ input: style['border-style'] })
      const borderStyleValue = getValue(borderStyle[0])
      const parsedBorderStyle = parseMultipleValues(borderStyleValue)

      if (parsedBorderStyle.length === 1) {
        if (!border.all) {
          border.all = {}
        }
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedBorderStyle[0],
          variables,
        })
        if (newProp.style) {
          border.all.style = newProp.style
        }

        // Apply to the single ones only if they are defined in the style
        if (
          border.top &&
          styleKeys.indexOf('border-style') >
            styleKeys.indexOf('border-top-style') &&
          styleKeys.indexOf('border-style') > styleKeys.indexOf('border-top')
        ) {
          border.top.style = newProp.style
        }
        if (
          border.bottom &&
          styleKeys.indexOf('border-style') >
            styleKeys.indexOf('border-bottom-style') &&
          styleKeys.indexOf('border-style') > styleKeys.indexOf('border-bottom')
        ) {
          border.bottom.style = newProp.style
        }
        if (
          border.left &&
          styleKeys.indexOf('border-style') >
            styleKeys.indexOf('border-left-style') &&
          styleKeys.indexOf('border-style') > styleKeys.indexOf('border-left')
        ) {
          border.left.style = newProp.style
        }
        if (
          border.right &&
          styleKeys.indexOf('border-style') >
            styleKeys.indexOf('border-right-style') &&
          styleKeys.indexOf('border-style') > styleKeys.indexOf('border-right')
        ) {
          border.right.style = newProp.style
        }
      } else {
        if (!border.top) {
          border.top = {}
        }
        if (!border.bottom) {
          border.bottom = {}
        }
        if (!border.left) {
          border.left = {}
        }
        if (!border.right) {
          border.right = {}
        }
        parsedBorderStyle.forEach((value, index: number) => {
          const newProp = parseBorderOrOutline({
            valueToCheck: value,
            variables,
          })
          if (newProp.style) {
            if (index === 0) {
              border.top = { ...border.top, style: newProp.style }
              border.bottom = { ...border.bottom, style: newProp.style }
            } else if (index === 1) {
              border.left = { ...border.left, style: newProp.style }
              border.right = { ...border.right, style: newProp.style }
            } else if (index === 2) {
              border.bottom = { ...border.bottom, style: newProp.style }
            } else {
              border.left = { ...border.left, style: newProp.style }
            }
          }
        })
      }
    }

    // Border color
    if (
      style['border-color'] &&
      (styleKeys.indexOf('border-color') > styleKeys.indexOf('border') ||
        invalidValuesAll.length > 0)
    ) {
      const borderColor = parse({ input: style['border-color'] })
      const borderColorValue = getValue(borderColor[0])
      const parsedBorderColor = parseMultipleValues(borderColorValue)

      if (parsedBorderColor.length === 1) {
        if (!border.all) {
          border.all = {}
        }
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedBorderColor[0],
          variables,
        })
        if (newProp.color) {
          border.all.color = newProp.color
        }

        // Apply to the single ones only if they are defined in the style
        if (
          border.top &&
          styleKeys.indexOf('border-color') >
            styleKeys.indexOf('border-top-color') &&
          styleKeys.indexOf('border-color') > styleKeys.indexOf('border-top')
        ) {
          border.top.color = newProp.color
        }
        if (
          border.bottom &&
          styleKeys.indexOf('border-color') >
            styleKeys.indexOf('border-bottom-color') &&
          styleKeys.indexOf('border-color') > styleKeys.indexOf('border-bottom')
        ) {
          border.bottom.color = newProp.color
        }
        if (
          border.left &&
          styleKeys.indexOf('border-color') >
            styleKeys.indexOf('border-left-color') &&
          styleKeys.indexOf('border-color') > styleKeys.indexOf('border-left')
        ) {
          border.left.color = newProp.color
        }
        if (
          border.right &&
          styleKeys.indexOf('border-color') >
            styleKeys.indexOf('border-right-color') &&
          styleKeys.indexOf('border-color') > styleKeys.indexOf('border-right')
        ) {
          border.right.color = newProp.color
        }
      } else {
        if (!border.top) {
          border.top = {}
        }
        if (!border.bottom) {
          border.bottom = {}
        }
        if (!border.left) {
          border.left = {}
        }
        if (!border.right) {
          border.right = {}
        }
        parsedBorderColor.forEach((value, index: number) => {
          const newProp = parseBorderOrOutline({
            valueToCheck: value,
            variables,
          })
          if (newProp.color) {
            if (index === 0) {
              border.top = { ...border.top, color: newProp.color }
              border.bottom = { ...border.bottom, color: newProp.color }
            } else if (index === 1) {
              border.left = { ...border.left, color: newProp.color }
              border.right = { ...border.right, color: newProp.color }
            } else if (index === 2) {
              border.bottom = { ...border.bottom, color: newProp.color }
            } else {
              border.left = { ...border.left, color: newProp.color }
            }
          }
        })
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const borderProperties = ['width', 'style', 'color'] as const

    const allPropertiesMissing = borderProperties.every((item) => {
      return border.all && !(item in border.all)
    })
    if (invalidValuesAll.length > 0 && allPropertiesMissing) {
      border.all = shorthandBorderAll

      borderProperties.forEach((key) => {
        if (borderProperties.includes(key) && !border.all?.[key]) {
          if (border.all) {
            border.all[key] = invalidValuesAll[0]
            invalidValuesAll.shift()
          }
        }
      })
    }

    const topPropertiesMissing = borderProperties.every((item) => {
      return border.top && !(item in border.top)
    })
    if (invalidValuesTop.length > 0 && topPropertiesMissing) {
      border.top = shorthandBorderTop ?? {}

      borderProperties.forEach((key) => {
        if (borderProperties.includes(key) && !border.top?.[key]) {
          if (border.top) {
            border.top[key] = invalidValuesTop[0]
            invalidValuesTop.shift()
          }
        }
      })
    }

    const bottomPropertiesMissing = borderProperties.every((item) => {
      return border.bottom && !(item in border.bottom)
    })
    if (invalidValuesBottom.length > 0 && bottomPropertiesMissing) {
      border.bottom = shorthandBorderBottom ?? {}

      borderProperties.forEach((key) => {
        if (borderProperties.includes(key) && !border.bottom?.[key]) {
          if (border.bottom) {
            border.bottom[key] = invalidValuesBottom[0]
            invalidValuesBottom.shift()
          }
        }
      })
    }

    const leftPropertiesMissing = borderProperties.every((item) => {
      return border.left && !(item in border.left)
    })
    if (invalidValuesLeft.length > 0 && leftPropertiesMissing) {
      border.left = shorthandBorderLeft ?? {}

      borderProperties.forEach((key) => {
        if (borderProperties.includes(key) && !border.left?.[key]) {
          if (border.left) {
            border.left[key] = invalidValuesLeft[0]
            invalidValuesLeft.shift()
          }
        }
      })
    }

    const rightPropertiesMissing = borderProperties.every((item) => {
      return border.right && !(item in border.right)
    })
    if (invalidValuesRight.length > 0 && rightPropertiesMissing) {
      border.right = shorthandBorderRight ?? {}

      borderProperties.forEach((key) => {
        if (borderProperties.includes(key) && !border.right?.[key]) {
          if (border.right) {
            border.right[key] = invalidValuesRight[0]
            invalidValuesRight.shift()
          }
        }
      })
    }

    return border
  } else {
    return null
  }
}

const getBorder = (args: {
  parsedBorder: {
    type: 'block'
    nodes: NodeTypes[]
  }[]
  styleKeys: string[]
  variables: CSSStyleToken[]
  borderSide: 'border-top' | 'border-bottom' | 'border-left' | 'border-right'
}) => {
  const styleKeys = args.styleKeys
  const variables = args.variables
  const borderSide = args.borderSide
  const tempBorder: ParsedBorderOutline = {}

  const invalidValues: ParsedValueType[] = []
  let shorthandBorder: ParsedBorderOutline = {}

  const values = getValue(args.parsedBorder[0])
  const allValues = parseMultipleValues(values)

  const allVariablesKnown = checkIfNoUnknownVariables({
    variables,
    allValues,
  })

  if (allVariablesKnown) {
    // Go through all the values in the border left property
    allValues.forEach((val) => {
      const newProp = parseBorderOrOutline({
        valueToCheck: val,
        variables,
      })
      if (newProp.invalidValue) {
        invalidValues.push(val)
      } else if (
        newProp.width &&
        styleKeys.indexOf(borderSide) > styleKeys.indexOf('border-width')
      ) {
        tempBorder.width = newProp.width
      } else if (
        newProp.style &&
        styleKeys.indexOf(borderSide) > styleKeys.indexOf('border-style')
      ) {
        tempBorder.style = newProp.style
      } else if (
        newProp.color &&
        styleKeys.indexOf(borderSide) > styleKeys.indexOf('border-color')
      ) {
        tempBorder.color = newProp.color
      }

      shorthandBorder = tempBorder
    })
  } else {
    // Parse the values by the order
    shorthandBorder = {
      width: allValues[0],
      style: allValues[1],
      color: allValues[2],
    }
  }

  const borderProperties = ['width', 'style', 'color'] as const

  const somePropertiesDefined = borderProperties.some((item) => {
    return item in shorthandBorder
  })

  if (somePropertiesDefined) {
    return { shorthandBorder, invalidValues }
  } else {
    return { shorthandBorder: null, invalidValues }
  }
}
