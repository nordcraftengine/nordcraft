import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
 */
export const handler: FormulaHandler<Record<string, Array<unknown>>> = ([
  items,
  func,
]) => {
  if (typeof func !== 'function') {
    return null
  }
  if (!items || typeof items !== 'object' || !Array.isArray(items)) {
    return null
  }

  const res: Record<string, any> = {}
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = String(func({ item, index: i }))
    if (res[key]) {
      res[key].push(item)
    } else {
      res[key] = [item]
    }
  }
  return res
}

export default handler

export const getArgumentInputData = (
  [items]: unknown[],
  argIndex: number,
  input: any,
) => {
  if (argIndex === 1 && Array.isArray(items) && items.length > 0) {
    return { ...input, Args: { item: items[0], index: 0 } }
  }
  return input
}
