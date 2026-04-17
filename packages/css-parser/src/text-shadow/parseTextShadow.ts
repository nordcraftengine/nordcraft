import { isDefined } from '@nordcraft/core/dist/utils/util'
import { colorFunction, globalValues } from '../const'
import {
  checkIfNoUnknownVariables,
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from '../shared'
import type { CSSStyleToken, ParsedTextShadow, ParsedValueType } from '../types'

export const getParsedTextShadow = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  if (style['text-shadow']) {
    const textShadow = parse({ input: style['text-shadow'] })

    return textShadow.map((shadow) => {
      const textShadow: ParsedTextShadow = {}
      const invalidValues: ParsedValueType[] = []

      const values = getValue(shadow)
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })

      if (allVariablesKnown) {
        allValues.forEach((pv) => {
          const newProp = parseTextShadow({
            textShadow,
            valueToCheck: pv,
            variables,
          })

          if (newProp.invalidValue) {
            invalidValues.push(pv)
          } else if (newProp.horizontal) {
            textShadow.horizontal = newProp.horizontal
          } else if (newProp.vertical) {
            textShadow.vertical = newProp.vertical
          } else if (newProp.blur) {
            textShadow.blur = newProp.blur
          } else if (newProp.color) {
            textShadow.color = newProp.color
          }
        })

        // We apply only if no invalid values
        if (invalidValues.length === 0) {
          return textShadow
        }
        // We also want to apply if the shorthand has invalid values
        const textShadowProperties = [
          'horizontal',
          'vertical',
          'blur',
          'color',
        ] as const

        if (invalidValues.length > 0) {
          textShadowProperties.forEach((key) => {
            if (textShadowProperties.includes(key) && !textShadow[key]) {
              textShadow[key] = invalidValues[0]
              invalidValues.shift()
            }
          })
        }

        return textShadow
      } else {
        // Parse the values by the order
        return {
          horizontal: allValues[0],
          vertical: allValues[1],
          blur: allValues[2],
          color: allValues[3],
        }
      }
    })
  } else {
    return null
  }
}

const parseTextShadow = (args: {
  textShadow: {
    horizontal?: ParsedValueType
    vertical?: ParsedValueType
    blur?: ParsedValueType
    color?: ParsedValueType
  }
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  const textShadow = args.textShadow
  const valueToCheck = args.valueToCheck
  const valueToReturn = args.valueToReturn
  const variables = args.variables

  if (!isDefined(valueToCheck)) {
    return {}
  }

  let horizontal
  let vertical
  let blur
  let color
  let invalidValue

  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'keyword' &&
        [...globalValues, 'none'].includes(valueToCheck.value)) ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0')) &&
    !textShadow.horizontal
  ) {
    horizontal = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0')) &&
    !textShadow.vertical
  ) {
    vertical = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0')) &&
    !textShadow.blur
  ) {
    blur = returnValue
  } else if (
    (valueToCheck.type !== 'functionArguments' &&
      isColor(valueToCheck.value)) ||
    (valueToCheck.type === 'function' &&
      colorFunction.includes(valueToCheck.name) &&
      isColor(`${valueToCheck.name}(${valueToCheck.value})`))
  ) {
    color = returnValue
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

        const value =
          usedVariable.unit && usedVariable.unit !== ''
            ? getValue(
                parse({
                  input: `${usedVariable.value}${usedVariable.unit}`,
                })[0],
              )
            : getValue(parse({ input: usedVariable.value })[0])

        const parsedVariable = parseMultipleValues(value)

        const newProp = parseTextShadow({
          textShadow,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.horizontal) {
          horizontal = returnValue
        } else if (newProp.vertical) {
          vertical = returnValue
        } else if (newProp.blur) {
          blur = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseTextShadow({
          textShadow,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.horizontal) {
          horizontal = returnValue
        } else if (newProp.vertical) {
          vertical = returnValue
        } else if (newProp.blur) {
          blur = returnValue
        }
      }
    })
  } else {
    invalidValue = true
  }
  return { horizontal, vertical, blur, color, invalidValue }
}
