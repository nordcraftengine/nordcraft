import { getValue, parse, parseMultipleValues } from '../shared'
import type { ParsedTranslate } from '../types'

export const parseTranslate = (
  style: Record<string, any>,
): ParsedTranslate | null => {
  if (!style.translate) {
    return null
  }
  const translate = parse({ input: style.translate })

  const values = parseMultipleValues(getValue(translate[0]))

  if (values.length === 1 && values[0]?.type === 'keyword') {
    return { type: 'keyword', value: values[0].value }
  } else {
    return {
      type: 'axis',
      x: values[0],
      y: values[1],
      z: values[2],
    }
  }
}
