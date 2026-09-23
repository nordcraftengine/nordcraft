import { getValue, parse, parseMultipleValues } from '../shared'
import type { ParsedScale } from '../types'

export const parseScale = (style: Record<string, any>): ParsedScale | null => {
  if (!style.scale) {
    return null
  }

  const scale = parse({ input: style.scale })
  const values = parseMultipleValues(getValue(scale[0]))

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
