import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  absoluteSize,
  fontStretchValues,
  genericFonts,
  relativeSize,
} from './const'
import {
  checkIfNoUnknownVariables,
  getValue,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { CSSStyleToken, ParsedFont, ParsedFontProperty } from './types'

export const getParsedFont = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)

  if (
    style['font-family'] ||
    style['font-size'] ||
    style['font-stretch'] ||
    style['font-style'] ||
    style['font-variant'] ||
    style['font-weight'] ||
    style['line-height'] ||
    style.font
  ) {
    let parsedFont: ParsedFont = { family: [] }

    const invalidValues: ParsedFontProperty[] = []
    const shorthandFont: {
      family: ParsedFontProperty[]
      size?: ParsedFontProperty
      stretch?: ParsedFontProperty
      style?: {
        angle?: ParsedFontProperty
        style?: ParsedFontProperty
      }
      variant?: ParsedFontProperty
      weight?: ParsedFontProperty
      lineHeight?: ParsedFontProperty
    } = {
      family: [],
    }

    if (style.font) {
      if (style.font === 'inherit') {
        parsedFont = {
          family: [{ type: 'keyword', value: 'inherit' }],
          size: { type: 'keyword', value: 'inherit' },
          stretch: { type: 'keyword', value: 'inherit' },
          style: {
            style: { type: 'keyword', value: 'inherit' },
          },
          variant: { type: 'keyword', value: 'inherit' },
          weight: { type: 'keyword', value: 'inherit' },
          lineHeight: { type: 'keyword', value: 'inherit' },
        }
      } else {
        const font = parse({ input: style.font, slashSplit: false })

        const allValues: ParsedFontProperty[][] = font.map((f) => {
          const values = getValue(f)
          return parseMultipleValues(values).filter(
            (v) => v.type !== 'functionArguments',
          )
        })

        const allValuesFlatted = allValues
          .flatMap((v) => v)
          .filter((v) => v.type !== 'slash')

        const allVariablesKnown = checkIfNoUnknownVariables({
          variables,
          allValues: allValuesFlatted,
        })

        if (allVariablesKnown) {
          let lineHeightToBeSet = false

          // Go through all the values in the font property
          allValues.forEach((pf, index: number) => {
            pf.forEach((property, i: number) => {
              const isLastItem = i === pf.length - 1

              const newProp = parseFont({
                font: shorthandFont,
                isLastItem,
                valueToCheck: property,
                lineHeightToBeSet,
                variables,
              })

              if (newProp.invalidValue) {
                invalidValues.push(property)
              } else if (newProp.style) {
                if (!shorthandFont.style) {
                  shorthandFont.style = { style: newProp.style }
                } else {
                  shorthandFont.style.style = newProp.style
                }
              } else if (newProp.styleAngle) {
                if (shorthandFont.style) {
                  shorthandFont.style.angle = newProp.styleAngle
                }
              } else if (newProp.variant) {
                shorthandFont.variant = newProp.variant
              } else if (newProp.weight) {
                shorthandFont.weight = newProp.weight
              } else if (newProp.stretch) {
                shorthandFont.stretch = newProp.stretch
              } else if (newProp.size) {
                shorthandFont.size = newProp.size
              } else if (newProp.lineHeight) {
                shorthandFont.lineHeight = newProp.lineHeight
              } else if (newProp.family) {
                shorthandFont.family[index] = newProp.family
              }
              lineHeightToBeSet = newProp.lineHeightToBeSet ?? false
            })
          })

          // We apply only if no invalid values
          if (invalidValues.length === 0) {
            parsedFont = shorthandFont
          }
        } else {
          // Parse the values by the order
          parsedFont = {
            style: {
              style: allValuesFlatted[0],
              angle: allValuesFlatted[1],
            },
            variant: allValuesFlatted[2],
            weight: allValuesFlatted[3],
            stretch: allValuesFlatted[4],
            size: allValuesFlatted[5],
            lineHeight: allValuesFlatted[6],
            family: allValuesFlatted[7] ? [allValuesFlatted[7]] : [],
          }
        }
      }
    }
    if (
      style['font-family'] &&
      (styleKeys.indexOf('font-family') > styleKeys.indexOf('font') ||
        parsedFont.family.length === 0 ||
        invalidValues.length > 0)
    ) {
      const fontFamily = parse({ input: style['font-family'] })

      const singlePropertyFamily: (
        | {
            type: 'keyword'
            value: string
          }
        | {
            type: 'string'
            value: string
            quote: "'" | '"'
          }
        | {
            type: 'function'
            name: string
            value: string
          }
      )[] = []

      fontFamily.forEach((family, index) => {
        const parsedFamily = parseMultipleValues(getValue(family))

        if (
          fontFamily.length === 1 &&
          ((parsedFamily[0]?.type === 'function' &&
            parsedFamily[0].name === 'var') ||
            !style.font)
        ) {
          // If it's a variable we always return that
          parsedFamily.forEach((pf) => {
            if (pf.type !== 'functionArguments') {
              if (singlePropertyFamily[index]) {
                singlePropertyFamily[index] = {
                  type: 'string',
                  value: `${singlePropertyFamily[index].value} ${pf.value}`,
                  quote: '"',
                }
              } else if (pf.type === 'string') {
                singlePropertyFamily[index] = {
                  ...pf,
                  type: pf.type,
                  quote: pf.quote ?? '"',
                }
              } else if (pf.type === 'keyword') {
                singlePropertyFamily[index] = {
                  ...pf,
                  type: pf.type,
                }
              } else if (pf.type === 'function' && pf.name === 'var') {
                singlePropertyFamily[index] = pf
              }
            }
          })
        } else {
          parsedFamily.forEach((pf) => {
            if (pf.type !== 'functionArguments') {
              // Check if it's a valid value
              const newProp = parseFont({
                font: { family: [] },
                isLastItem: true,
                valueToCheck: pf,
                variables,
                lineHeightToBeSet: false,
              })
              if (newProp.family) {
                if (singlePropertyFamily[index]) {
                  singlePropertyFamily[index] = {
                    type: 'string',
                    value: `${singlePropertyFamily[index].value} ${newProp.family.value}`,
                    quote: '"',
                  }
                } else if (newProp.family.type === 'keyword') {
                  singlePropertyFamily[index] = {
                    ...newProp.family,
                    type: newProp.family.type,
                  }
                } else if (newProp.family.type === 'string') {
                  singlePropertyFamily[index] = {
                    ...newProp.family,
                    type: newProp.family.type,
                    quote: newProp.family.quote ?? '"',
                  }
                } else if (
                  newProp.family.type === 'function' &&
                  newProp.family.name === 'var'
                ) {
                  singlePropertyFamily[index] = newProp.family
                }
              }
            }
          })
        }
      })

      if (singlePropertyFamily.length > 0) {
        parsedFont.family = singlePropertyFamily
      }
    }
    if (
      style['font-size'] &&
      (styleKeys.indexOf('font-size') > styleKeys.indexOf('font') ||
        !parsedFont.size ||
        invalidValues.length > 0)
    ) {
      const fontSize = parse({ input: style['font-size'] })
      const parsedFontSize = parseMultipleValues(getValue(fontSize[0]))[0]

      // If it's a variable we always return that
      if (
        ((parsedFontSize?.type === 'function' &&
          parsedFontSize.name === 'var') ||
          !style.font) &&
        parsedFontSize?.type !== 'functionArguments'
      ) {
        parsedFont.size = parsedFontSize
      } else if (parsedFontSize?.type !== 'functionArguments') {
        // Check if it's a valid value
        const newProp = parseFont({
          font: { family: [] },
          valueToCheck: parsedFontSize,
          variables,
          lineHeightToBeSet: false,
        })
        if (newProp.size) {
          parsedFont.size = newProp.size
        }
      }
    }

    const familyAndSizeSet = parsedFont.family.length > 0 && parsedFont.size

    if (
      style['font-stretch'] &&
      (styleKeys.indexOf('font-stretch') > styleKeys.indexOf('font') ||
        !parsedFont.stretch ||
        !familyAndSizeSet ||
        invalidValues.length > 0)
    ) {
      const fontStretch = parse({ input: style['font-stretch'] })
      const parsedFontStretch = parseMultipleValues(getValue(fontStretch[0]))[0]

      // If it's a variable we always return that
      if (
        ((parsedFontStretch?.type === 'function' &&
          parsedFontStretch.name === 'var') ||
          !style.font) &&
        parsedFontStretch?.type !== 'functionArguments'
      ) {
        parsedFont.stretch = parsedFontStretch
      } else if (parsedFontStretch?.type !== 'functionArguments') {
        // Check if it's a valid value
        const newProp = parseFont({
          font: { family: [] },
          valueToCheck: parsedFontStretch,
          variables,
          lineHeightToBeSet: false,
        })
        if (newProp.stretch) {
          parsedFont.stretch = newProp.stretch
        }
      }
    }
    if (
      style['font-style'] &&
      (styleKeys.indexOf('font-style') > styleKeys.indexOf('font') ||
        !parsedFont.style ||
        !familyAndSizeSet ||
        invalidValues.length > 0)
    ) {
      const fontStyle = parse({ input: style['font-style'] })
      const parsedFontStyle = parseMultipleValues(getValue(fontStyle[0]))

      parsedFontStyle.forEach((fs) => {
        // If it's a variable we always return that
        if (
          ((fs.type === 'function' && fs.name === 'var') || !style.font) &&
          fs.type !== 'functionArguments'
        ) {
          if (!parsedFont.style?.style) {
            parsedFont.style = { style: fs }
          } else {
            parsedFont.style.angle = fs
          }
        } else if (fs.type !== 'functionArguments') {
          // Check if it's a valid value
          const newProp = parseFont({
            font: parsedFont,
            valueToCheck: fs,
            variables,
            lineHeightToBeSet: false,
          })

          if (newProp.style) {
            parsedFont.style = { style: newProp.style }
          } else if (newProp.styleAngle) {
            if (parsedFont.style) {
              parsedFont.style.angle = newProp.styleAngle
            }
          }
        }
      })
    }
    if (
      style['font-weight'] &&
      (styleKeys.indexOf('font-weight') > styleKeys.indexOf('font') ||
        !parsedFont.weight ||
        !familyAndSizeSet ||
        invalidValues.length > 0)
    ) {
      const fontWeight = parse({ input: style['font-weight'] })
      const parsedFontWeight = parseMultipleValues(getValue(fontWeight[0]))[0]

      // If it's a variable we always return that
      if (
        ((parsedFontWeight?.type === 'function' &&
          parsedFontWeight.name === 'var') ||
          !style.font) &&
        parsedFontWeight?.type !== 'functionArguments'
      ) {
        parsedFont.weight = parsedFontWeight
      } else if (parsedFontWeight?.type !== 'functionArguments') {
        // Check if it's a valid value
        const newProp = parseFont({
          font: { family: [] },
          valueToCheck: parsedFontWeight,
          variables,
          lineHeightToBeSet: false,
        })
        if (newProp.weight) {
          parsedFont.weight = newProp.weight
        }
      }
    }
    if (
      style['line-height'] &&
      (styleKeys.indexOf('line-height') > styleKeys.indexOf('font') ||
        !parsedFont.lineHeight ||
        !familyAndSizeSet ||
        invalidValues.length > 0)
    ) {
      const lineHeight = parse({ input: style['line-height'] })
      const parsedLineHeight = parseMultipleValues(getValue(lineHeight[0]))[0]

      // If it's a variable we always return that
      if (
        ((parsedLineHeight?.type === 'function' &&
          parsedLineHeight.name === 'var') ||
          !style.font) &&
        parsedLineHeight?.type !== 'functionArguments'
      ) {
        parsedFont.lineHeight = parsedLineHeight
      } else if (parsedLineHeight?.type !== 'functionArguments') {
        // Check if it's a valid value
        const newProp = parseFont({
          font: { family: [] },
          valueToCheck: parsedLineHeight,
          variables,
          lineHeightToBeSet: true,
        })

        if (newProp.lineHeight) {
          parsedFont.lineHeight = newProp.lineHeight
        }
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const fontProperties = [
      'family',
      'size',
      'stretch',
      'style',
      'variant',
      'weight',
      'lineHeight',
    ] as const

    const allPropertiesMissing = fontProperties.every((item) => {
      if (item === 'family') {
        return true
      }
      return !(item in parseFont)
    })

    if (
      invalidValues.length > 0 &&
      allPropertiesMissing &&
      parsedFont.family.length === 0
    ) {
      parsedFont = shorthandFont
      fontProperties.forEach((key) => {
        if (key === 'family') {
          if (parsedFont.family.length === 0 && invalidValues[0]) {
            parsedFont.family = [invalidValues[0]]
            invalidValues.shift()
          }
        } else if (fontProperties.includes(key) && !parsedFont[key]) {
          parsedFont[key] = invalidValues[0]
          invalidValues.shift()
        }
      })
    }
    return parsedFont
  } else {
    return null
  }
}

const parseFont = (args: {
  font: ParsedFont
  isLastItem?: boolean
  valueToCheck?: ParsedFontProperty
  lineHeightToBeSet: boolean
  valueToReturn?: ParsedFontProperty
  variables: CSSStyleToken[]
}) => {
  let style: ParsedFontProperty | undefined
  let styleAngle: ParsedFontProperty | undefined
  let variant: ParsedFontProperty | undefined
  let weight: ParsedFontProperty | undefined
  let stretch: ParsedFontProperty | undefined
  let size: ParsedFontProperty | undefined
  let lineHeight: ParsedFontProperty | undefined
  let family: ParsedFontProperty | undefined
  let invalidValue: boolean | undefined

  const font = args.font
  const isLastItem = args.isLastItem

  let lineHeightToBeSet = args.lineHeightToBeSet
  const variables = args.variables
  const valueToCheck = args.valueToCheck
  const returnValue = args.valueToReturn ? args.valueToReturn : valueToCheck

  if (!isDefined(valueToCheck)) {
    return {}
  }

  if (['italic', 'oblique'].includes(valueToCheck.value)) {
    style = returnValue
  } else if (
    valueToCheck.type === 'angle' &&
    font.style?.style?.value === 'oblique'
  ) {
    styleAngle = returnValue
  } else if (
    ['small-caps'].includes(valueToCheck.value) ||
    valueToCheck.type === 'angle'
  ) {
    variant = returnValue
  } else if (
    ['bolder', 'lighter', 'bold'].includes(valueToCheck.value) ||
    (valueToCheck.type === 'number' &&
      (Number(valueToCheck.value) >= 1 || Number(valueToCheck.value) <= 1000) &&
      !font.size)
  ) {
    weight = returnValue
  } else if (fontStretchValues.includes(valueToCheck.value)) {
    stretch = returnValue
  } else if (
    (valueToCheck.value === 'normal' ||
      valueToCheck.type === 'number' ||
      valueToCheck.type === 'length') &&
    lineHeightToBeSet
  ) {
    lineHeight = returnValue
  } else if (
    absoluteSize.includes(valueToCheck.value) ||
    relativeSize.includes(valueToCheck.value) ||
    (valueToCheck.type === 'length' && !font.size) ||
    (valueToCheck.type === 'function' && valueToCheck.name === 'math')
  ) {
    size = returnValue
  } else if (
    genericFonts.includes(valueToCheck.value) ||
    ((valueToCheck.type === 'string' || valueToCheck.type === 'keyword') &&
      isLastItem)
  ) {
    family = returnValue
  } else if (valueToCheck.type === 'function' && valueToCheck.name === 'var') {
    // If it's a variable
    const allValues = valueToCheck.value.split(', ')
    allValues.forEach((val) => {
      if (isVariable(val)) {
        const usedVariable = variables.find((v) =>
          v.name.startsWith('--') ? v.name === val : `--${v.name}` === val,
        )
        if (!usedVariable) {
          return
        }

        const parsedVariable = parseMultipleValues([
          {
            type: 'word',
            value:
              usedVariable.unit && usedVariable.unit !== ''
                ? `${usedVariable.value}${usedVariable.unit}`
                : usedVariable.value,
          },
        ])
        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parseFont({
            font,
            isLastItem,
            valueToCheck: parsedVariable[0],
            lineHeightToBeSet,
            valueToReturn: valueToCheck,
            variables,
          })

          if (newProp.style) {
            style = returnValue
          } else if (newProp.styleAngle) {
            styleAngle = returnValue
          } else if (newProp.variant) {
            variant = returnValue
          } else if (newProp.weight) {
            weight = returnValue
          } else if (newProp.stretch) {
            stretch = returnValue
          } else if (newProp.size) {
            size = returnValue
          } else if (newProp.lineHeight) {
            lineHeight = returnValue
          } else if (newProp.family) {
            family = returnValue
          }
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        if (parsedVariable[0]?.type !== 'functionArguments') {
          const newProp = parseFont({
            font,
            isLastItem,
            valueToCheck: parsedVariable[0],
            lineHeightToBeSet,
            valueToReturn: valueToCheck,
            variables,
          })

          if (newProp.style) {
            style = returnValue
          } else if (newProp.styleAngle) {
            styleAngle = returnValue
          } else if (newProp.variant) {
            variant = returnValue
          } else if (newProp.weight) {
            weight = returnValue
          } else if (newProp.stretch) {
            stretch = returnValue
          } else if (newProp.size) {
            size = returnValue
          } else if (newProp.lineHeight) {
            lineHeight = returnValue
          } else if (newProp.family) {
            family = returnValue
          }
        }
      }
    })
  } else if (valueToCheck.type === 'slash') {
    // Flag that the size is set and
    lineHeightToBeSet = true
  } else {
    invalidValue = true
  }
  return {
    style,
    styleAngle,
    variant,
    weight,
    stretch,
    size,
    lineHeight,
    family,
    lineHeightToBeSet,
    invalidValue,
  }
}
