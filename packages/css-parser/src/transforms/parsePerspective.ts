import { getValue, parse, parseMultipleValues } from '../shared'
import type { ParsedPerspective } from '../types'

export const parsePerspective = (
  style: Record<string, any>,
): ParsedPerspective | null => {
  if (!style.perspective) {
    return null
  }

  const perspective = parse({ input: style.perspective })
  const values = parseMultipleValues(getValue(perspective[0]))

  if (values.length === 1 && values[0]?.type === 'keyword') {
    return { type: 'keyword', value: values[0]?.value }
  } else {
    return values[0] ?? null
  }
}
