import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([collection, item]) => {
  if (typeof collection === 'string') {
    return collection.lastIndexOf(item as any)
  }

  if (Array.isArray(collection)) {
    // Short-circuit for primitive types and references
    const fastIndex = collection.lastIndexOf(item)
    if (fastIndex !== -1) {
      return fastIndex
    }

    return collection.findLastIndex((i) =>
      (globalThis as any).toddle.isEqual(i, item),
    )
  }
  return null
}

export default handler
