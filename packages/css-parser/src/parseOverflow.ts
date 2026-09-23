import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getValue, parse, parseMultipleValues } from './shared'
import type { ParsedValueType } from './types'

const validOverflowValues = [
  'visible',
  'hidden',
  'clip',
  'scroll',
  'auto',
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
]

const getIsValidOverflowValue = (value: ParsedValueType) => {
  if (value.type === 'function' && value.name === 'var') {
    return true
  }

  if (value.type === 'keyword') {
    return validOverflowValues.includes(value.value)
  }
}

export const getParsedOverflow = (style: Record<string, any>) => {
  if (!style.overflow && !style['overflow-x'] && !style['overflow-y']) {
    return null
  }

  let parsedOverflow: {
    x?: ParsedValueType
    y?: ParsedValueType
  } = {}

  const overflow = parse({ input: style.overflow })
  const overflowValues = parseMultipleValues(getValue(overflow[0]))

  if (overflowValues.length > 0) {
    parsedOverflow = {
      x: overflowValues[0],
      y: overflowValues[1] ?? overflowValues[0],
    }
  }

  const isShorthandValid = overflowValues.every((value) =>
    getIsValidOverflowValue(value),
  )

  const styleKeys = Object.keys(style)

  if (
    style['overflow-x'] &&
    (styleKeys.indexOf('overflow-x') > styleKeys.indexOf('overflow') ||
      !isShorthandValid)
  ) {
    const overflowX = parse({ input: style['overflow-x'] })
    const overflowXValue = parseMultipleValues(getValue(overflowX[0]))[0]

    if (isDefined(overflowXValue)) {
      const isValid =
        !style.overflow ||
        !isShorthandValid ||
        getIsValidOverflowValue(overflowXValue)

      if (isValid) {
        parsedOverflow.x = overflowXValue
      }
    }
  }

  if (
    style['overflow-y'] &&
    (styleKeys.indexOf('overflow-y') > styleKeys.indexOf('overflow') ||
      !isShorthandValid)
  ) {
    const overflowY = parse({ input: style['overflow-y'] })
    const overflowYValue = parseMultipleValues(getValue(overflowY[0]))[0]

    if (isDefined(overflowYValue)) {
      const isValid =
        !style.overflow ||
        !isShorthandValid ||
        getIsValidOverflowValue(overflowYValue)

      if (isValid) {
        parsedOverflow.y = overflowYValue
      }
    }
  }

  return parsedOverflow
}
