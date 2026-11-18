import type { FormulaHandler } from '@nordcraft/core'
import { get, isObject } from '@nordcraft/core'

const handler: FormulaHandler<unknown> = ([collection, key]) => {
  if (typeof collection === 'string') {
    return collection[Number(key)]
  }
  if (Array.isArray(key)) {
    return get(collection, key)
  }
  return isObject(collection) ? collection[String(key)] : undefined
}

export default handler
