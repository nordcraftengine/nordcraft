import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isObject } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<
  string | Array<unknown> | Record<string, unknown>
> = (items) => {
  if (items.every(Array.isArray)) {
    const result = []
    for (const item of items) {
      result.push(...item)
    }
    return result
  }
  if (items.every(isObject)) {
    return Object.assign({}, ...items)
  }
  return items.join('')
}

export default handler
