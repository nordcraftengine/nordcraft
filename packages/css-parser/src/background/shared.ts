import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getValue, getVariableValue, parseMultipleValues } from '../shared'
import type {
  BackgroundPositionType,
  CSSStyleToken,
  NodeTypes,
  ParsedValueType,
} from '../types'
import { parseConicGradient } from './parseConicGradient'
import { parseImageSet } from './parseImageSet'
import { parseLinearGradient } from './parseLinearGradient'
import { parseRadialGradient } from './parseRadialGradient'

export const getParsedValue = (
  property: NodeTypes,
  variables: CSSStyleToken[],
) => {
  const splitValues =
    property.type === 'function' &&
    [
      'linear-gradient',
      'conic-gradient',
      'radial-gradient',
      'repeating-linear-gradient',
      'repeating-conic-gradient',
      'repeating-radial-gradient',
      'image-set',
    ].includes(property.value)

  const splitChildFuncValues =
    property.type === 'function' && ['image-set'].includes(property.value)

  const propValue = getValue(property, splitValues, splitChildFuncValues)

  if (propValue.length === 0) {
    return null
  }

  if (propValue[0]?.type === 'function') {
    const parsedValues = parseMultipleValues(propValue)

    if (parsedValues[0]?.type === 'functionArguments') {
      if (
        propValue[0].name === 'linear-gradient' ||
        propValue[0].name === 'repeating-linear-gradient'
      ) {
        return parseLinearGradient(
          parsedValues[0].arguments,
          propValue[0].name,
          variables,
        )
      } else if (
        propValue[0].name === 'conic-gradient' ||
        propValue[0].name === 'repeating-conic-gradient'
      ) {
        return parseConicGradient(
          parsedValues[0].arguments,
          propValue[0].name,
          variables,
        )
      } else if (
        propValue[0].name === 'radial-gradient' ||
        propValue[0].name === 'repeating-radial-gradient'
      ) {
        return parseRadialGradient(
          parsedValues[0].arguments,
          propValue[0].name,
          variables,
        )
      } else if (propValue[0].name === 'image-set') {
        return parseImageSet({ parsedValues, variables })
      } else {
        return parseMultipleValues(propValue)[0] ?? null
      }
    } else {
      return parseMultipleValues(propValue)[0] ?? null
    }
  } else {
    return parseMultipleValues(propValue)[0] ?? null
  }
}

export const getNewPositions = ({
  position,
  previousVal,
  lastPositionVal,
  returnValue,
}: {
  position: BackgroundPositionType | undefined
  previousVal?: ParsedValueType
  lastPositionVal: boolean
  returnValue: ParsedValueType
}) => {
  let newPosition = isDefined(position) ? { ...position } : undefined
  if (!isDefined(newPosition)) {
    newPosition = {
      x: { offset: returnValue },
    }
  } else {
    if (lastPositionVal) {
      if (!isDefined(newPosition.x)) {
        newPosition.x = { offset: returnValue }
      } else if (!isDefined(newPosition.y)) {
        newPosition.y = { offset: returnValue }
      } else if (previousVal?.type !== 'functionArguments') {
        if (
          previousVal?.type === newPosition.x.align?.type &&
          previousVal?.value === newPosition.x.align?.value
        ) {
          newPosition.x = { ...newPosition.x, offset: returnValue }
        } else if (
          previousVal?.type === newPosition.y.align?.type &&
          previousVal?.value === newPosition.y.align?.value
        ) {
          newPosition.y = { ...newPosition.y, offset: returnValue }
        }
      }
    } else {
      if (previousVal?.type !== 'functionArguments') {
        if (
          previousVal?.type === newPosition.x?.align?.type &&
          previousVal?.value === newPosition.x?.align?.value
        ) {
          newPosition.x = { ...newPosition.x, offset: returnValue }
        } else if (
          previousVal?.type === newPosition.y?.align?.type &&
          previousVal?.value === newPosition.y?.align?.value
        ) {
          newPosition.y = { ...newPosition.y, offset: returnValue }
        }
      }
    }
  }

  return newPosition
}

export const getNextKnowStopPosition = (
  currentIndex: number,
  stops: {
    position?: {
      start?: ParsedValueType
      end?: ParsedValueType
    }
    color?: ParsedValueType
    midpoint?: ParsedValueType
  }[],
) => {
  let index = currentIndex + 1
  while (index < stops.length) {
    if (stops[index]?.position) {
      return {
        value:
          stops[index]?.position?.start ??
          ({ type: 'length', value: '100', unit: '%' } as ParsedValueType),
        index,
      }
    }
    index++
  }
  return {
    value: { type: 'length', value: '100', unit: '%' } as ParsedValueType,
    index: stops.length,
  }
}

export const getStopValue = ({
  parsedValue,
  variables,
}: {
  parsedValue?: ParsedValueType
  variables: CSSStyleToken[]
}) => {
  const val = getVariableValue({ value: parsedValue, variables })
  if (val?.type === 'length') {
    return { val: Number(val.value), unit: val.unit }
  }
}

export const calculateStopsPosition = ({
  stops,
  variables,
}: {
  stops: {
    position?:
      | {
          start?: ParsedValueType | undefined
          end?: ParsedValueType
        }
      | undefined
    color?: ParsedValueType
  }[]
  variables: CSSStyleToken[]
}) => {
  const newStops = [...stops]
  if (newStops[0] && !newStops[0]?.position?.start) {
    newStops[0].position = { start: { type: 'length', value: '0', unit: '%' } }
  }
  const lastIndex = newStops.length - 1
  if (newStops[lastIndex] && !newStops[lastIndex]?.position?.start) {
    newStops[lastIndex].position = {
      start: { type: 'length', value: '100', unit: '%' },
    }
  }

  newStops.forEach((s, index) => {
    if (!s.position && newStops[index]) {
      const previousStop = getStopValue({
        parsedValue: newStops[index - 1]?.position?.start,
        variables,
      })
      const nextKnownStop = getNextKnowStopPosition(index, newStops)

      if (
        previousStop?.unit !== '%' ||
        (nextKnownStop.value.type === 'length' &&
          nextKnownStop.value.unit !== '%')
      ) {
        return
      }
      const previousValue = previousStop.val
      const nextValue =
        getStopValue({
          parsedValue: nextKnownStop.value,
          variables,
        })?.val ?? 100

      const pos =
        previousValue +
        (nextValue - previousValue) / (nextKnownStop.index - (index - 1))

      newStops[index].position = {
        ...newStops[index].position,
        start: { type: 'length', value: `${pos}`, unit: '%' },
      }
    }
  })

  return newStops
}
