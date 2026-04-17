import { isDefined } from '@nordcraft/core/dist/utils/util'
import {
  hueInterpolationMethod,
  polarColorSpace,
  rectangularColorSpace,
} from '../const'
import {
  getValue,
  isColor,
  isVariable,
  parse,
  parseMultipleValues,
} from '../shared'
import type {
  CSSStyleToken,
  ParsedLinearGradientType,
  ParsedValueType,
} from '../types'
import { calculateStopsPosition } from './shared'

const checkValue = ({
  value,
  returnValue,
  direction,
  interpolation,
  stops,
  variables,
}: {
  value: ParsedValueType
  returnValue: ParsedValueType
  direction?: ParsedValueType
  interpolation?: ParsedValueType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
    midpoint?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
}) => {
  let newDirection = direction
  let newStops = stops
  let newInterpolation = interpolation

  const invalidValues: ParsedValueType[] = []
  if (value.type === 'keyword') {
    if (value.value === 'to') {
      if (!newDirection) {
        newDirection = { type: 'string', value: 'to' }
      }
    } else if (['top', 'bottom', 'left', 'right'].includes(value.value)) {
      if (!newDirection) {
        newDirection = returnValue
      } else if (
        newDirection.type !== 'functionArguments' &&
        returnValue.type !== 'functionArguments'
      ) {
        newDirection.value += ` ${returnValue.value}`
      }
    } else if (value.value === 'in') {
      if (!newInterpolation) {
        newInterpolation = { type: 'string', value: 'in' }
      }
    } else if (
      rectangularColorSpace.includes(value.value) ||
      polarColorSpace.includes(value.value) ||
      hueInterpolationMethod.includes(value.value)
    ) {
      if (!newInterpolation) {
        newInterpolation = returnValue
      } else if (
        newInterpolation.type !== 'functionArguments' &&
        returnValue.type !== 'functionArguments'
      ) {
        newInterpolation.value += ` ${returnValue.value}`
      }
    } else if (isColor(value.value)) {
      // this should be color like red, blue....
      newStops[newStops.length] = { color: returnValue }
    } else {
      invalidValues.push(returnValue)
    }
  } else if (value.type === 'angle') {
    newDirection = returnValue
  } else if (value.type === 'length') {
    const index = newStops.length - 1
    if (isDefined(newStops[index])) {
      if (newStops[index].position?.start) {
        newStops[index].position.end = returnValue
      } else {
        newStops[index].position = { start: returnValue }
      }
    }
  } else if (value.type === 'hex') {
    newStops[newStops.length] = { color: returnValue }
  } else if (value.type === 'function' && value.name === 'var') {
    const newProp = checkVariableValueLinear({
      value,
      stops: newStops,
      variables,
      valueToReturn: returnValue,
    })
    if (newProp.invalidValues.length > 0) {
      invalidValues.push(...newProp.invalidValues)
    } else if (newProp.direction) {
      newDirection = newProp.direction
    } else if (newProp.stops.length > 0) {
      newStops = newProp.stops
    }
  } else if (value.type === 'function' && value.name === 'calc') {
    const index = newStops.length - 1
    if (isDefined(newStops[index])) {
      if (newStops[index].position?.start) {
        newStops[index].position.end = returnValue
      } else {
        newStops[index].position = { start: returnValue }
      }
    }
  } else if (
    value.type === 'function' &&
    isColor(`${value.name}(${value.value})`)
  ) {
    // this should be the color using functions
    newStops[newStops.length] = { color: returnValue }
  } else {
    invalidValues.push(returnValue)
  }

  return {
    newDirection,
    newStops,
    newInterpolation,
    invalidValues,
  }
}

const checkVariableValueLinear = (args: {
  value: ParsedValueType
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
    midpoint?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
  valueToReturn?: ParsedValueType
}) => {
  const invalidValues: ParsedValueType[] = []
  let direction: ParsedValueType | undefined
  let newStops = args.stops

  const returnValue = args.valueToReturn ?? args.value
  const allValues =
    args.value.type !== 'functionArguments'
      ? args.value.value.split(', ').map((v) => v.trim())
      : []

  allValues.forEach((val) => {
    if (isVariable(val)) {
      const usedVariable = args.variables.find((v) =>
        v.name.startsWith('--') ? v.name === val : `--${v.name}` === val,
      )
      if (!usedVariable) {
        return
      }

      const parsedUsedVariable =
        usedVariable.unit &&
        usedVariable.unit !== '' &&
        !usedVariable.value.endsWith(usedVariable.unit)
          ? parse({ input: `${usedVariable.value}${usedVariable.unit}` })
          : parse({ input: usedVariable.value })

      const parsedUsedVariableVal = getValue(parsedUsedVariable[0])
      const parsedVariable = parseMultipleValues(parsedUsedVariableVal)[0]
      if (!isDefined(parsedVariable)) {
        return
      }

      const newValues = checkValue({
        value: parsedVariable,
        returnValue,
        stops: newStops,
        variables: args.variables,
      })

      direction = newValues.newDirection
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    } else {
      const parsedVariable = parseMultipleValues([
        { type: 'word', value: val },
      ])[0]
      if (!isDefined(parsedVariable)) {
        return
      }
      const newValues = checkValue({
        value: parsedVariable,
        returnValue,
        stops: newStops,
        variables: args.variables,
      })

      direction = newValues.newDirection
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    }
  })

  return {
    invalidValues,
    direction,
    stops: newStops,
  }
}

export const parseLinearGradient = (
  parsedValues: ParsedValueType[],
  funcName: 'linear-gradient' | 'repeating-linear-gradient',
  variables: CSSStyleToken[],
): ParsedLinearGradientType => {
  let direction: ParsedValueType | undefined
  let stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
    midpoint?: ParsedValueType
  }[] = []
  let interpolation: ParsedValueType | undefined
  const invalidValues: ParsedValueType[] = []

  parsedValues.map((arg) => {
    const newValues = checkValue({
      value: arg,
      returnValue: arg,
      direction,
      interpolation,
      stops,
      variables,
    })
    direction = newValues.newDirection
    interpolation = newValues.newInterpolation
    stops = newValues.newStops
    invalidValues.push(...newValues.invalidValues)
  })

  // Make sure the first and the last stops have positions
  stops = calculateStopsPosition({ stops, variables })

  return {
    type: 'linear-function',
    name: funcName,
    direction,
    stops,
    interpolation,
    invalidValues,
  }
}
