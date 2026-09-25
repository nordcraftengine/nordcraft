import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 * but this implementation also supports objects
 */
export const handler: FormulaHandler<unknown> = ([items, fx]) => {
  if (typeof fx !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (fx({ item, index: i })) {
        return item
      }
    }
    return undefined
  }
  if (items && typeof items === 'object') {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        const value = (items as any)[key]
        if (fx({ key, value })) {
          return value
        }
      }
    }
    return undefined
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
    return { ...input, Args: { item: items[0], index: 0 } }
  }
  if (items && typeof items === 'object') {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        return { ...input, Args: { key, value: (items as any)[key] } }
      }
    }
  }
  return input
}
