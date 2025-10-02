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
    return items.every((item, index) => fx({ item, index }))
  }
  if (items && typeof items === 'object') {
    return Object.entries(items).every(([key, value]) => fx({ key, value }))
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
    const [first] = Object.entries(items)
    if (first) {
      return { ...input, Args: { key: first[0], value: first[1] } }
    }
  }
  return input
}
