import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
 * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
 */
const handler: FormulaHandler<boolean> = ([collection, item]) => {
  if (typeof collection === 'string' && typeof item === 'string') {
    return collection.includes(item)
  }
  if (Array.isArray(collection)) {
    return collection.some((collectionItem) =>
      (globalThis as any).toddle.isEqual(collectionItem, item),
    )
  }
  return null
}

export default handler
