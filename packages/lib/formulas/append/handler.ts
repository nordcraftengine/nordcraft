import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown>> = ([list, value]) => {
  if (!Array.isArray(list)) {
    return null
  }
  // Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
  return [...list, value]
}

export default handler
