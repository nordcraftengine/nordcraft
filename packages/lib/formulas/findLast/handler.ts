import type { FormulaHandler } from '@nordcraft/core/dist/types'

export const handler: FormulaHandler<unknown> = ([items, fx]) => {
  if (typeof fx !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    return items.findLast((item, index) => fx({ item, index }))
  }
  if (items && typeof items === 'object') {
    return Object.entries(items).findLast(([key, value]) =>
      fx({ key, value }),
    )?.[1]
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
