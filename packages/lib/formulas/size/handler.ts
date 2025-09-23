import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isObject } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<number> = ([collection]) => {
  if (Array.isArray(collection)) {
    return collection.length
  }
  if (isObject(collection)) {
    return Object.keys(collection).length
  }
  if (typeof collection === 'string') {
    return collection.length
  }
  return null
}

export default handler
