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
    return Object.fromEntries(
      Object.entries(items).filter(([key, value]) => func({ key, value })),
    )
  }
  if (Array.isArray(items)) {
    return items.filter((item, index) => func({ item, index }))
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
      return { ...input, Args: { value: first[1], key: first[0] } }
    }
  }
  return input
}
