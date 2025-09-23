import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 * but also works for objects
 */
const handler: FormulaHandler<Array<unknown> | Record<string, unknown>> = ([
  items,
  fx,
]) => {
  if (typeof fx !== 'function') {
    return null
  }
  if (Array.isArray(items)) {
    return items.map((item, index) => fx({ item, index }))
  }
  if (items && typeof items === 'object') {
    return Object.fromEntries(
      Object.entries(items).map<any>(([key, value]) => {
        const res = fx({ key, value })
        if ('key' in res && 'value' in res) {
          return [res.key, res.value]
        }
        return null
      }),
    )
  }
  return null
}

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

export default handler
