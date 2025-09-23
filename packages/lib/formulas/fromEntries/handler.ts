import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
 * but requires the input to be an array of objects with `key` and `value` properties.
 */
const handler: FormulaHandler<Record<string, unknown>> = ([list]) => {
  if (Array.isArray(list)) {
    const object: Record<string, any> = {}
    for (const { key, value } of list) {
      object[key] = value
    }
    return object
  }
  return null
}

export default handler
