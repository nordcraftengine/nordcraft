import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<boolean> = ([collection, prefix]) => {
  if (typeof collection !== 'string') {
    return null
  }
  if (typeof prefix !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
  return collection.startsWith(prefix)
}

export default handler
