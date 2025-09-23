import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown> | string> = ([list, count]) => {
  if (typeof count !== 'number' || isNaN(count)) {
    return null
  }
  if (Array.isArray(list)) {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    return list.slice(0, list.length - count)
  }
  if (typeof list === 'string') {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring
    return list.substring(0, list.length - count)
  }
  return null
}

export default handler
