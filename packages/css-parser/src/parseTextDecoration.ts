import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  colorFunction,
  textDecorationLine,
  textDecorationStyleValues,
} from './const'
import {
  checkIfNoUnknownVariables,
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { CSSStyleToken, ParsedValueType } from './types'

export const getParsedTextDecoration = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  const styleKeys = Object.keys(style)

  if (
    style['text-decoration-line'] ||
    style['text-decoration-style'] ||
    style['text-decoration-color'] ||
    style['text-decoration-thickness'] ||
    style['text-decoration']
  ) {
    let parsedTextDecoration: {
      line?: ParsedValueType[]
      style?: ParsedValueType
      color?: ParsedValueType
      thickness?: ParsedValueType
    } = {}

    const invalidValues: ParsedValueType[] = []
    const shorthandTextDecoration: {
      line?: ParsedValueType[]
      style?: ParsedValueType
      color?: ParsedValueType
      thickness?: ParsedValueType
    } = {}

    if (style['text-decoration']) {
      const textDecoration = parse({ input: style['text-decoration'] })

      const values = getValue(textDecoration[0])
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })

      if (allVariablesKnown) {
        // Go through all the values in the text-decoration property
        allValues.forEach((property) => {
          const newProp = parseDecoration({ valueToCheck: property, variables })

          if (newProp.invalidValue) {
            invalidValues.push(property)
          } else if (newProp.line) {
            if (shorthandTextDecoration.line) {
              shorthandTextDecoration.line.push(newProp.line)
            } else {
              shorthandTextDecoration.line = [newProp.line]
            }
          } else if (newProp.style) {
            shorthandTextDecoration.style = newProp.style
          } else if (newProp.color) {
            shorthandTextDecoration.color = newProp.color
          } else if (newProp.thickness) {
            shorthandTextDecoration.thickness = newProp.thickness
          }
        })

        // We apply only if no invalid values
        if (invalidValues.length === 0) {
          parsedTextDecoration = shorthandTextDecoration
        }
      } else {
        // Parse the values by the order
        if (allValues[0]) {
          parsedTextDecoration.line = [allValues[0]]
        }
        if (allValues[1]) {
          parsedTextDecoration.style = allValues[1]
        }
        if (allValues[2]) {
          parsedTextDecoration.color = allValues[2]
        }
        if (allValues[3]) {
          parsedTextDecoration.thickness = allValues[3]
        }
      }
    }
    if (
      style['text-decoration-line'] &&
      (styleKeys.indexOf('text-decoration-line') >
        styleKeys.indexOf('text-decoration') ||
        !parsedTextDecoration.line ||
        invalidValues.length > 0)
    ) {
      const textDecorationLine = parse({ input: style['text-decoration-line'] })
      const parsedTextDecorationLine = parseMultipleValues(
        getValue(textDecorationLine[0]),
      )

      parsedTextDecoration.line = []

      parsedTextDecorationLine.forEach((line) => {
        // If it's a variable we always return that
        if (
          (line.type === 'function' && line.name === 'var') ||
          !style['text-decoration']
        ) {
          if (!parsedTextDecoration.line) {
            parsedTextDecoration.line = [line]
          } else {
            parsedTextDecoration.line.push(line)
          }
        } else {
          // Check if it's a valid value
          const newProp = parseDecoration({
            valueToCheck: line,
            variables,
          })
          if (newProp.line) {
            if (!parsedTextDecoration.line) {
              parsedTextDecoration.line = [newProp.line]
            } else {
              parsedTextDecoration.line.push(newProp.line)
            }
          }
        }
      })
    }
    if (
      style['text-decoration-style'] &&
      (styleKeys.indexOf('text-decoration-style') >
        styleKeys.indexOf('text-decoration') ||
        !parsedTextDecoration.style ||
        invalidValues.length > 0)
    ) {
      const textDecorationStyle = parse({
        input: style['text-decoration-style'],
      })
      const parsedTextDecorationStyle = parseMultipleValues(
        getValue(textDecorationStyle[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedTextDecorationStyle) &&
          parsedTextDecorationStyle.type === 'function' &&
          parsedTextDecorationStyle.name === 'var') ||
        !style['text-decoration']
      ) {
        parsedTextDecoration.style = parsedTextDecorationStyle
      } else {
        // Check if it's a valid value
        const newProp = parseDecoration({
          valueToCheck: parsedTextDecorationStyle,
          variables,
        })
        if (newProp.style) {
          parsedTextDecoration.style = newProp.style
        }
      }
    }
    if (
      style['text-decoration-color'] &&
      (styleKeys.indexOf('text-decoration-color') >
        styleKeys.indexOf('text-decoration') ||
        !parsedTextDecoration.color ||
        invalidValues.length > 0)
    ) {
      const textDecorationColor = parse({
        input: style['text-decoration-color'],
      })
      const parsedTextDecorationColor = parseMultipleValues(
        getValue(textDecorationColor[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedTextDecorationColor) &&
          parsedTextDecorationColor.type === 'function' &&
          parsedTextDecorationColor.name === 'var') ||
        !style['text-decoration']
      ) {
        parsedTextDecoration.color = parsedTextDecorationColor
      } else {
        // Check if it's a valid value
        const newProp = parseDecoration({
          valueToCheck: parsedTextDecorationColor,
          variables,
        })
        if (newProp.color) {
          parsedTextDecoration.color = newProp.color
        }
      }
    }
    if (
      style['text-decoration-thickness'] &&
      (styleKeys.indexOf('text-decoration-thickness') >
        styleKeys.indexOf('text-decoration') ||
        !parsedTextDecoration.thickness ||
        invalidValues.length > 0)
    ) {
      const textDecorationThickness = parse({
        input: style['text-decoration-thickness'],
      })
      const parsedTextDecorationThickness = parseMultipleValues(
        getValue(textDecorationThickness[0]),
      )[0]

      // If it's a variable we always return that
      if (
        (isDefined(parsedTextDecorationThickness) &&
          parsedTextDecorationThickness.type === 'function' &&
          parsedTextDecorationThickness.name === 'var') ||
        !style['text-decoration']
      ) {
        parsedTextDecoration.thickness = parsedTextDecorationThickness
      } else {
        // Check if it's a valid value
        const newProp = parseDecoration({
          valueToCheck: parsedTextDecorationThickness,
          variables,
        })
        if (newProp.thickness) {
          parsedTextDecoration.thickness = newProp.thickness
        }
      }
    }

    // We also want to apply if the shorthand has invalid values and there are no any single properties defined
    const textDecorationProperties = [
      'line',
      'style',
      'color',
      'thickness',
    ] as const

    const allPropertiesMissing = textDecorationProperties.every(
      (item) => !(item in parsedTextDecoration),
    )
    if (invalidValues.length > 0 && allPropertiesMissing) {
      parsedTextDecoration = shorthandTextDecoration
      textDecorationProperties.forEach((key) => {
        if (
          textDecorationProperties.includes(key) &&
          !parsedTextDecoration[key]
        ) {
          if (invalidValues[0]) {
            if (key === 'line') {
              parsedTextDecoration.line = [invalidValues[0]]
              invalidValues.shift()
            } else {
              parsedTextDecoration[key] = invalidValues[0]
              invalidValues.shift()
            }
          }
        }
      })
    }

    return parsedTextDecoration
  } else {
    return null
  }
}

const parseDecoration = (args: {
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  let line
  let style
  let color
  let thickness
  let invalidValue

  const valueToCheck = args.valueToCheck
  const variables = args.variables
  const returnValue = args.valueToReturn ? args.valueToReturn : valueToCheck

  if (!isDefined(valueToCheck)) {
    return {}
  }

  if (
    valueToCheck.type === 'keyword' &&
    textDecorationLine.includes(valueToCheck.value)
  ) {
    line = returnValue
  } else if (
    valueToCheck.type === 'keyword' &&
    textDecorationStyleValues.includes(valueToCheck.value)
  ) {
    style = returnValue
  } else if (
    (valueToCheck.type !== 'functionArguments' &&
      isColor(valueToCheck.value)) ||
    (valueToCheck.type === 'function' &&
      colorFunction.includes(valueToCheck.name) &&
      isColor(`${valueToCheck.name}(${valueToCheck.value})`))
  ) {
    color = returnValue
  } else if (
    (valueToCheck.type === 'keyword' &&
      ['auto', 'from-font'].includes(valueToCheck.value)) ||
    valueToCheck.type === 'length'
  ) {
    thickness = returnValue
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
        const newProp = parseDecoration({
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.line) {
          line = returnValue
        } else if (newProp.style) {
          style = returnValue
        } else if (newProp.color) {
          color = returnValue
        } else if (newProp.thickness) {
          thickness = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseDecoration({
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.line) {
          line = returnValue
        } else if (newProp.style) {
          style = returnValue
        } else if (newProp.color) {
          color = returnValue
        } else if (newProp.thickness) {
          thickness = returnValue
        }
      }
    })
  } else {
    invalidValue = true
  }
  return { line, style, color, thickness, invalidValue }
}
