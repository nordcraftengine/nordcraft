import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isObject } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<number> = ([collection]) => {
  if (Array.isArray(collection)) {
    return collection.length
  }
  if (isObject(collection)) {
    let count = 0
    for (const key in collection) {
      if (Object.prototype.hasOwnProperty.call(collection, key)) {
        count++
      }
    }
    return count
  }
  if (typeof collection === 'string') {
    return collection.length
  }
  return null
}

export default handler
