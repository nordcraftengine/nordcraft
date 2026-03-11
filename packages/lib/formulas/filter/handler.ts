import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 * but this implementation also supports objects
 */
export const handler: FormulaHandler<
  Array<unknown> | Record<string, unknown>
> = ([items, func]) => {
  if (typeof func !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    return items.filter((item, index) => func({ item, index }))
  }
  if (items && typeof items === 'object') {
    const res: Record<string, any> = {}
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        const value = (items as any)[key]
        if (func({ key, value })) {
          res[key] = value
        }
      }
    }
    return res
  }
  return null
}

export default handler

export const getArgumentInputData = (
  [items]: unknown[],
  argIndex: number,
  input: any,
) => {
  if (argIndex === 0) {
    return input
  }

  if (Array.isArray(items)) {
    if (items.length > 0) {
      return { ...input, Args: { item: items[0], index: 0 } }
    }
  } else if (items && typeof items === 'object') {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        return { ...input, Args: { value: (items as any)[key], key } }
      }
    }
  }
  return input
}
