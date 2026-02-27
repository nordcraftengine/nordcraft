import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 * but also works with objects
 */
const handler: FormulaHandler<unknown> = ([items, fx, init]) => {
  if (typeof fx !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    let result = init
    for (let i = 0; i < items.length; i++) {
      result = fx({ result, item: items[i], index: i })
    }
    return result
  }
  if (items && typeof items === 'object') {
    let result = init
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        result = fx({ result, key, value: (items as any)[key] })
      }
    }
    return result
  }
  return null
}
export default handler

export const getArgumentInputData = (
  [items, _, result]: unknown[],
  argIndex: number,
  input: any,
) => {
  if (argIndex !== 1) {
    return input
  }
  if (Array.isArray(items)) {
    if (items.length > 0) {
      return {
        ...input,
        Args: {
          item: items[0],
          index: 0,
          result,
        },
      }
    }
  } else if (items && typeof items === 'object') {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        return {
          ...input,
          Args: {
            key,
            value: (items as any)[key],
            result,
          },
        }
      }
    }
  }
  return input
}
