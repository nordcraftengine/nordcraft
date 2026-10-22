import type { FormulaHandler } from '@nordcraft/core'
import { get } from '@nordcraft/core'

const handler: FormulaHandler<unknown> = ([collection, key]) => {
  if (typeof collection === 'string') {
    return collection[Number(key)]
  }
  return Array.isArray(key)
    ? get(collection, key)
    : (collection as any)?.[key as PropertyKey]
}

export default handler
