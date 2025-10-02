import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown>> = ([inputString, delimiter]) => {
  if (typeof inputString !== 'string') {
    return null
  }
  if (typeof delimiter !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split
  return inputString.split(delimiter)
}
export default handler
