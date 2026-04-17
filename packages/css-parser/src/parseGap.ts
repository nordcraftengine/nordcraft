import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getValue, parse, parseMultipleValues } from './shared'
import type { ParsedGap, ParsedValueType } from './types'

const getIsValidGapValue = (value: ParsedValueType) =>
  (value.type === 'function' && value.name === 'var') || value.type === 'length'

export const getParsedGap = (style: Record<string, any>) => {
  if (!style.gap && !style['row-gap'] && !style['column-gap']) {
    return null
  }

  let parsedGap: ParsedGap = {}

  const gap = parse({ input: style.gap })
  const gapValues = parseMultipleValues(getValue(gap[0]))

  if (gapValues.length > 0) {
    parsedGap = {
      row: gapValues[0],
      column: gapValues[1] ?? gapValues[0],
    }
  }

  const isShorthandValid = gapValues.every((value) => getIsValidGapValue(value))

  const styleKeys = Object.keys(style)

  if (
    style['row-gap'] &&
    (styleKeys.indexOf('row-gap') > styleKeys.indexOf('gap') ||
      !isShorthandValid)
  ) {
    const rowGap = parse({ input: style['row-gap'] })
    const rowGapValue = parseMultipleValues(getValue(rowGap[0]))[0]

    if (isDefined(rowGapValue)) {
      const isValid =
        !style.gap || !isShorthandValid || getIsValidGapValue(rowGapValue)

      if (isValid) {
        parsedGap.row = rowGapValue
      }
    }
  }

  if (
    style['column-gap'] &&
    (styleKeys.indexOf('column-gap') > styleKeys.indexOf('gap') ||
      !isShorthandValid)
  ) {
    const columnGap = parse({ input: style['column-gap'] })
    const columnGapValue = parseMultipleValues(getValue(columnGap[0]))[0]

    if (isDefined(columnGapValue)) {
      const isValid =
        !style.gap || !isShorthandValid || getIsValidGapValue(columnGapValue)

      if (isValid) {
        parsedGap.column = columnGapValue
      }
    }
  }

  return parsedGap
}
