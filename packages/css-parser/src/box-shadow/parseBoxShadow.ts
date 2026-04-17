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
import type { CSSStyleToken, ParsedBoxShadow, ParsedValueType } from '../types'

export const getParsedBoxShadow = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
) => {
  if (style['box-shadow']) {
    const boxShadow = parse({ input: style['box-shadow'] })

    return boxShadow.map((shadow) => {
      const boxShadow: ParsedBoxShadow = {}
      const invalidValues: ParsedValueType[] = []

      const values = getValue(shadow)
      const allValues = parseMultipleValues(values)

      const allVariablesKnown = checkIfNoUnknownVariables({
        variables,
        allValues,
      })

      if (allVariablesKnown) {
        allValues.forEach((pv) => {
          const newProp = parseBoxShadow({
            boxShadow,
            valueToCheck: pv,
            variables,
          })
          if (newProp.invalidValue) {
            invalidValues.push(pv)
          } else if (newProp.horizontal) {
            boxShadow.horizontal = newProp.horizontal
          } else if (newProp.vertical) {
            boxShadow.vertical = newProp.vertical
          } else if (newProp.blur) {
            boxShadow.blur = newProp.blur
          } else if (newProp.spread) {
            boxShadow.spread = newProp.spread
          } else if (newProp.color) {
            boxShadow.color = newProp.color
          } else if (newProp.position) {
            boxShadow.position = newProp.position
          }
        })

        // We apply only if no invalid values
        if (invalidValues.length === 0) {
          return boxShadow
        }
        // We also want to apply if the shorthand has invalid values and there are no any single properties defined
        const boxShadowProperties = [
          'horizontal',
          'vertical',
          'blur',
          'spread',
          'color',
          'position',
        ] as const

        if (invalidValues.length > 0) {
          boxShadowProperties.forEach((key) => {
            if (boxShadowProperties.includes(key) && !boxShadow[key]) {
              boxShadow[key] = invalidValues[0]
              invalidValues.shift()
            }
          })
        }
        return boxShadow
      } else {
        // Parse the values by the order
        return {
          horizontal: allValues[0],
          vertical: allValues[1],
          blur: allValues[2],
          spread: allValues[3],
          color: allValues[4],
          position: allValues[5],
        }
      }
    })
  } else {
    return null
  }
}

const parseBoxShadow = (args: {
  boxShadow: {
    horizontal?: ParsedValueType
    vertical?: ParsedValueType
    blur?: ParsedValueType
    spread?: ParsedValueType
    color?: ParsedValueType
    position?: ParsedValueType
  }
  valueToCheck?: ParsedValueType
  valueToReturn?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  const boxShadow = args.boxShadow
  const valueToCheck = args.valueToCheck
  const valueToReturn = args.valueToReturn
  const variables = args.variables

  if (!isDefined(valueToCheck)) {
    return {}
  }

  let horizontal
  let vertical
  let blur
  let spread
  let color
  let position
  let invalidValue

  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  if (
    valueToCheck.type === 'keyword' &&
    ['outset', 'inset'].includes(valueToCheck.value)
  ) {
    position = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0') ||
      (valueToCheck.type === 'keyword' &&
        [...globalValues, 'none'].includes(valueToCheck.value))) &&
    !boxShadow.horizontal
  ) {
    horizontal = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0') ||
      (valueToCheck.type === 'keyword' &&
        [...globalValues, 'none'].includes(valueToCheck.value))) &&
    !boxShadow.vertical
  ) {
    vertical = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0')) &&
    !boxShadow.blur
  ) {
    blur = returnValue
  } else if (
    (valueToCheck.type === 'length' ||
      (valueToCheck.type === 'number' && valueToCheck.value === '0')) &&
    !boxShadow.spread
  ) {
    spread = returnValue
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

        const newProp = parseBoxShadow({
          boxShadow,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.position) {
          position = returnValue
        } else if (newProp.horizontal) {
          horizontal = returnValue
        } else if (newProp.vertical) {
          vertical = returnValue
        } else if (newProp.blur) {
          blur = returnValue
        } else if (newProp.spread) {
          spread = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseBoxShadow({
          boxShadow,
          valueToCheck: parsedVariable[0],
          valueToReturn: valueToCheck,
          variables,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.position) {
          position = returnValue
        } else if (newProp.horizontal) {
          horizontal = returnValue
        } else if (newProp.vertical) {
          vertical = returnValue
        } else if (newProp.blur) {
          blur = returnValue
        } else if (newProp.spread) {
          spread = returnValue
        }
      }
    })
  } else {
    invalidValue = true
  }
  return { horizontal, vertical, blur, spread, color, position, invalidValue }
}
