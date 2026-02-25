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
    const res = new Array(items.length)
    for (let i = 0; i < items.length; i++) {
      res[i] = fx({ item: items[i], index: i })
    }
    return res
  }
  if (items && typeof items === 'object') {
    const res: Record<string, any> = {}
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        const value = (items as any)[key]
        const mapped = fx({ key, value })
        if (
          mapped &&
          typeof mapped === 'object' &&
          'key' in mapped &&
          'value' in mapped
        ) {
          res[String(mapped.key)] = mapped.value
        }
      }
    }
    return res
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

export default handler
