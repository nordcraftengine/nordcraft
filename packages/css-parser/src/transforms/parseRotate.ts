import {
  getValue,
  getVariableValue,
  parse,
  parseMultipleValues,
} from '../shared'
import type { CSSStyleToken, ParsedRotate } from '../types'

export const getParsedRotate = (
  style: Record<string, any>,
  variables: CSSStyleToken[],
): ParsedRotate | null | undefined => {
  if (!style.rotate) {
    return null
  }
  const rotate = parse({ input: style.rotate })
  const allValues = parseMultipleValues(getValue(rotate[0]))

  const firstValue = allValues[0]

  if (allValues.length === 1) {
    if (firstValue?.type === 'keyword') {
      return { type: 'keyword', value: firstValue.value }
    } else {
      return {
        type: 'axis',
        z: { type: 'number', value: '1' },
        angle: firstValue,
      }
    }
  } else if (allValues.length === 2) {
    const axisIndex = allValues
      .map((value) => getVariableValue({ value, variables }))
      .findIndex(
        (value) =>
          value?.type === 'keyword' && ['x', 'y', 'z'].includes(value.value),
      )

    if (axisIndex > -1) {
      const axisValue = getVariableValue({
        value: allValues[axisIndex],
        variables,
      })

      if (axisValue?.type === 'keyword') {
        const axis = axisValue.value

        return {
          type: 'axis',
          [axis]: {
            type: 'number',
            value: '1',
          },
          angle: allValues[1 - axisIndex],
        }
      }
    }

    return null
  } else if (allValues.length === 4) {
    const lastValue = allValues[3]
    const lastValueWithVariable = getVariableValue({
      value: lastValue,
      variables,
    })

    const firstValueWithVariable = getVariableValue({
      value: firstValue,
      variables,
    })

    if (
      lastValueWithVariable?.type === 'number' &&
      firstValueWithVariable?.type !== 'number'
    ) {
      return {
        type: 'axis',
        angle: firstValue,
        x: allValues[1],
        y: allValues[2],
        z: lastValue,
      }
    }

    return {
      type: 'axis',
      x: firstValue,
      y: allValues[1],
      z: allValues[2],
      angle: lastValue,
    }
  } else {
    return {
      type: 'axis',
      x: allValues[0],
      y: allValues[1],
      z: allValues[2],
    }
  }
}
