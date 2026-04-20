import { isDefined } from '@nordcraft/core/dist/utils/util'
import { colorFunction, lineStyle, outlineStyle } from './const'
import {
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from './shared'
import type { CSSStyleToken, ParsedValueType } from './types'

export const parseBorderOrOutline = (args: {
  valueToCheck?: ParsedValueType
  variables: CSSStyleToken[]
  property?: string
  valueToReturn?: ParsedValueType
}) => {
  let width
  let style
  let color
  let invalidValue

  const valueToCheck = args.valueToCheck
  const valueToReturn = args.valueToReturn
  const variables = args.variables
  const property = args.property ?? 'border'

  if (!isDefined(valueToCheck)) {
    return {}
  }

  const returnValue = valueToReturn ? valueToReturn : valueToCheck

  if (
    (valueToCheck.type !== 'functionArguments' &&
      isColor(valueToCheck.value)) ||
    (valueToCheck.type === 'function' &&
      colorFunction.includes(valueToCheck.name))
  ) {
    color = returnValue
  } else if (
    valueToCheck.type === 'length' ||
    (valueToCheck.type === 'keyword' &&
      ['thin', 'medium', 'thick'].includes(valueToCheck.value))
  ) {
    width = returnValue
  } else if (
    (property === 'border' &&
      valueToCheck.type === 'keyword' &&
      lineStyle.includes(valueToCheck.value.toLowerCase())) ||
    (property === 'outline' &&
      valueToCheck.type === 'keyword' &&
      outlineStyle.includes(valueToCheck.value.toLowerCase()))
  ) {
    style = returnValue
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
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedVariable[0],
          property,
          variables,
          valueToReturn: valueToCheck,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.width) {
          width = returnValue
        } else if (newProp.style) {
          style = returnValue
        }
      } else {
        const parsedVariable = parseMultipleValues([
          { type: 'word', value: val },
        ])
        const newProp = parseBorderOrOutline({
          valueToCheck: parsedVariable[0],
          property,
          variables,
          valueToReturn: valueToCheck,
        })

        if (newProp.color) {
          color = returnValue
        } else if (newProp.width) {
          width = returnValue
        } else if (newProp.style) {
          style = returnValue
        }
      }
    })
  } else {
    invalidValue = true
  }
  return { width, style, color, invalidValue }
}
