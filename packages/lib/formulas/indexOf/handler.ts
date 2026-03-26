import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
 * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
 */
const handler: FormulaHandler<number> = ([collection, item]) => {
  if (typeof collection === 'string') {
    return collection.indexOf(item as any)
  }

  if (Array.isArray(collection)) {
    // Short-circuit for primitive types and references
    const fastIndex = collection.indexOf(item)
    if (fastIndex !== -1) {
      return fastIndex
    }

    return collection.findIndex((i) =>
      (globalThis as any).toddle.isEqual(i, item),
    )
  }
  return null
}

export default handler
