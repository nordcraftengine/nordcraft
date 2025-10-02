import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = ([list, separator]) => {
  if (Array.isArray(list)) {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join
    return list.join(String(separator))
  }
  return null
}

export default handler
