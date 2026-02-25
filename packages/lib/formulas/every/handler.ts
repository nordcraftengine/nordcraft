import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
 * but also works with objects
 */
export const handler: FormulaHandler<boolean> = ([items, fx]: unknown[]) => {
  if (typeof fx !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      if (!fx({ item: items[i], index: i })) {
        return false
      }
    }
    return true
  }
  if (items && typeof items === 'object') {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        if (!fx({ key, value: (items as any)[key] })) {
          return false
        }
      }
    }
    return true
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
        return { ...input, Args: { key, value: (items as any)[key] } }
      }
    }
  }
  return input
}
