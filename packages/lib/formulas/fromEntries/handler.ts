import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
 * but requires the input to be an array of objects with `key` and `value` properties named as `key` and `value` respectively
 */
const handler: FormulaHandler<Record<string, unknown>> = ([list]) => {
  if (Array.isArray(list)) {
    const object: Record<string, any> = {}
    for (let i = 0; i < list.length; i++) {
      const entry = list[i]
      if (entry && typeof entry === 'object' && 'key' in entry) {
        object[String(entry.key)] = (entry as any).value
      }
    }
    return object
  }
  return null
}

export default handler
