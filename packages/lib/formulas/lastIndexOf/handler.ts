import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([collection, item]) => {
  if (typeof collection === 'string') {
    return collection.lastIndexOf(item as any)
  }

  if (Array.isArray(collection)) {
    return collection.findLastIndex((i) =>
      (globalThis as any).toddle.isEqual(i, item),
    )
  }
  return null
}

export default handler
