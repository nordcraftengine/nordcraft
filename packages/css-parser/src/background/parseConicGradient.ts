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
  BackgroundPositionType,
  CSSStyleToken,
  ParsedConicGradientType,
  ParsedValueType,
} from '../types'
import { calculateStopsPosition, getNewPositions } from './shared'

const checkConicFuncValue = ({
  parsedVariable,
  returnValue,
  previousVal,
  lastPositionVal,
  angleToBeSet,
  position,
  stops,
  variables,
}: {
  parsedVariable: ParsedValueType
  returnValue: ParsedValueType
  previousVal?: ParsedValueType
  lastPositionVal: boolean
  angleToBeSet: boolean
  position?: BackgroundPositionType
  stops: {
    position?:
      | {
          start?: ParsedValueType
          end?: ParsedValueType
        }
      | undefined
    color?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
}) => {
  const invalidValues: ParsedValueType[] = []
  let newAngle: ParsedValueType | undefined
  let newPosition = isDefined(position) ? { ...position } : undefined
  let newStops = [...stops]

  if (parsedVariable.type === 'keyword') {
    if (['center'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          x: { align: returnValue },
          y: { align: returnValue },
        }
      } else {
        if (!newPosition.x?.align) {
          newPosition.x = { ...newPosition.x, align: returnValue }
        } else {
          newPosition.y = { ...newPosition.y, align: returnValue }
        }
      }
    } else if (['top', 'bottom'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          y: { align: returnValue },
        }
      } else {
        newPosition.y = { ...newPosition.y, align: returnValue }
      }
    } else if (['left', 'right'].includes(parsedVariable.value)) {
      if (!newPosition) {
        newPosition = {
          x: { align: returnValue },
        }
      } else {
        newPosition.x = { ...newPosition.x, align: returnValue }
      }
    } else if (isColor(parsedVariable.value)) {
      // this should be color like red, blue....
      newStops[newStops.length] = {
        ...newStops[newStops.length],
        color: returnValue,
      }
    } else {
      invalidValues.push(returnValue)
    }
  } else if (parsedVariable.type === 'angle') {
    if (angleToBeSet) {
      newAngle = returnValue
    } else {
      const stopPosition = newStops[newStops.length - 1]?.position ?? {}
      if (stopPosition.start) {
        stopPosition.end = returnValue
      } else {
        stopPosition.start = returnValue
      }
      const index = newStops.length - 1
      if (isDefined(newStops[index])) {
        newStops[index].position = stopPosition
      }
    }
  } else if (parsedVariable.type === 'number' && parsedVariable.value === '0') {
    if (angleToBeSet) {
      newAngle = returnValue
    } else if (newStops.length === 0) {
      newPosition = getNewPositions({
        position: newPosition,
        previousVal,
        lastPositionVal,
        returnValue,
      })
    } else {
      const stopPosition = newStops[newStops.length - 1]?.position ?? {}
      if (stopPosition.start) {
        stopPosition.end = returnValue
      } else {
        stopPosition.start = returnValue
      }
      const index = newStops.length - 1
      if (isDefined(newStops[index])) {
        newStops[index].position = stopPosition
      }
    }
  } else if (parsedVariable.type === 'length') {
    if (newStops.length === 0) {
      newPosition = getNewPositions({
        position: newPosition,
        previousVal,
        lastPositionVal,
        returnValue,
      })
    } else if (parsedVariable.unit === '%') {
      const stopPosition = newStops[newStops.length - 1]?.position ?? {}
      if (stopPosition.start) {
        stopPosition.end = returnValue
      } else {
        stopPosition.start = returnValue
      }
      const index = newStops.length - 1
      if (isDefined(newStops[index])) {
        newStops[index].position = stopPosition
      }
    } else {
      invalidValues.push(returnValue)
    }
  } else if (parsedVariable.type === 'hex') {
    newStops[newStops.length] = {
      ...newStops[newStops.length],
      color: returnValue,
    }
  } else if (
    parsedVariable.type === 'function' &&
    parsedVariable.name === 'var'
  ) {
    const newProp = checkVariableValueConic({
      value: parsedVariable,
      position: newPosition,
      previousVal,
      lastPositionVal,
      stops: newStops,
      variables,
      angleToBeSet,
      valueToReturn: returnValue,
    })
    if (newProp.invalidValues.length > 0) {
      invalidValues.push(...newProp.invalidValues)
    }
    if (newProp.angle) {
      newAngle = newProp.angle
    }
    if (newProp.position) {
      newPosition = newProp.position
    }
    if (newProp.stops.length > 0) {
      newStops = newProp.stops
    }
  } else if (
    parsedVariable.type === 'function' &&
    parsedVariable.name === 'calc'
  ) {
    const index = newStops.length - 1
    if (isDefined(newStops[index])) {
      if (newStops[index].position?.start) {
        newStops[index].position.end = returnValue
      } else {
        newStops[index].position = { start: returnValue }
      }
    }
  } else if (
    parsedVariable.type === 'function' &&
    isColor(`${parsedVariable.name}(${parsedVariable.value})`)
  ) {
    // this should be the color using functions
    newStops[newStops.length] = {
      ...newStops[newStops.length],
      color: returnValue,
    }
  } else {
    invalidValues.push(returnValue)
  }
  return {
    newAngle,
    newPosition,
    newStops,
    invalidValues,
  }
}

const checkVariableValueConic = (args: {
  value: ParsedValueType
  position?: BackgroundPositionType
  previousVal?: ParsedValueType
  lastPositionVal: boolean
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
  angleToBeSet: boolean
  valueToReturn?: ParsedValueType
}) => {
  const invalidValues: ParsedValueType[] = []
  let angle: ParsedValueType | undefined
  let newPosition = isDefined(args.position) ? { ...args.position } : undefined
  let newStops = [...args.stops]

  const angleToBeSet = args.angleToBeSet

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

      const newValues = checkConicFuncValue({
        parsedVariable,
        returnValue,
        previousVal: args.previousVal,
        lastPositionVal: args.lastPositionVal,
        position: newPosition,
        angleToBeSet,
        stops: newStops,
        variables: args.variables,
      })

      angle = newValues.newAngle
      newPosition = newValues.newPosition
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    } else {
      const parsedVariable = parseMultipleValues([
        { type: 'word', value: val },
      ])[0]
      if (!isDefined(parsedVariable)) {
        return
      }
      const newValues = checkConicFuncValue({
        parsedVariable,
        returnValue,
        previousVal: args.previousVal,
        lastPositionVal: args.lastPositionVal,
        position: newPosition,
        angleToBeSet,
        stops: newStops,
        variables: args.variables,
      })

      angle = newValues.newAngle
      newPosition = newValues.newPosition
      newStops = newValues.newStops
      invalidValues.push(...newValues.invalidValues)
    }
  })

  return {
    invalidValues,
    angle,
    position: newPosition,
    stops: newStops,
  }
}

export const parseConicGradient = (
  parsedValues: ParsedValueType[],
  funcName: 'conic-gradient' | 'repeating-conic-gradient',
  variables: CSSStyleToken[],
): ParsedConicGradientType => {
  let angle: ParsedValueType | undefined
  let position: BackgroundPositionType | undefined
  let stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
  }[] = []
  let interpolation: ParsedValueType | undefined
  const invalidValues: ParsedValueType[] = []
  let positionToBeSet = false
  let angleToBeSet = false

  parsedValues.map((arg, index) => {
    if (arg.type === 'keyword' && arg.value === 'from') {
      angleToBeSet = true
      positionToBeSet = false
    } else if (arg.type === 'keyword' && arg.value === 'at') {
      positionToBeSet = true
    } else if (arg.type === 'keyword' && arg.value === 'in') {
      interpolation = { type: 'string', value: 'in' }
      positionToBeSet = false
    } else if (
      arg.type === 'keyword' &&
      (rectangularColorSpace.includes(arg.value) ||
        polarColorSpace.includes(arg.value) ||
        hueInterpolationMethod.includes(arg.value)) &&
      interpolation &&
      interpolation.type !== 'functionArguments'
    ) {
      interpolation.value += ` ${arg.value}`
    } else {
      let lastPositionVal = false
      if (positionToBeSet) {
        const nextValue = parsedValues[index + 1]

        if (isDefined(nextValue)) {
          const checkNextVal = checkConicFuncValue({
            parsedVariable: nextValue,
            returnValue: nextValue,
            previousVal: parsedValues[index - 1],
            lastPositionVal,
            angleToBeSet,
            position,
            stops,
            variables,
          })

          lastPositionVal = checkNextVal.newStops.length > 0
        }
      }

      const newValues = checkConicFuncValue({
        parsedVariable: arg,
        returnValue: arg,
        previousVal: parsedValues[index - 1],
        lastPositionVal,
        angleToBeSet,
        position,
        stops,
        variables,
      })

      if (newValues.newAngle) {
        angle = newValues.newAngle
        angleToBeSet = false
        positionToBeSet = false
      }
      position = newValues.newPosition
      if (newValues.newStops.length > 0) {
        stops = newValues.newStops
        positionToBeSet = false
      }
      invalidValues.push(...newValues.invalidValues)
    }
  })

  // Make sure the first and the last stops have positions
  stops = calculateStopsPosition({ stops, variables })

  return {
    type: 'conic-function',
    name: funcName,
    angle,
    position,
    stops,
    interpolation,
    invalidValues,
  }
}
