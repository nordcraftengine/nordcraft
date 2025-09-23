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
    return items.reduce(
      (result, item, index) => fx({ result, item, index }),
      init,
    )
  }
  if (items && typeof items === 'object') {
    return Object.entries(items).reduce(
      (result, [key, value]) => fx({ result, key, value }),
      init,
    )
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
    return {
      ...input,
      Args: {
        item: items[0],
        index: 0,
        result,
      },
    }
  }
  if (items && typeof items === 'object') {
    const [first] = Object.entries(items)
    if (first) {
      return {
        ...input,
        Args: {
          key: first[0],
          value: first[1],
          result,
        },
      }
    }
  }
  return input
}
