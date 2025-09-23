import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { isObject } from '@nordcraft/core/dist/utils/util'

const handler: FormulaHandler<
  string | Array<unknown> | Record<string, unknown>
> = (items) => {
  if (items.every(Array.isArray)) {
    const result = []
    for (const item of items) {
      // Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
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
