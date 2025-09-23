import type { FormulaHandler } from '@nordcraft/core/dist/types'
import { parseJSONWithDate } from '@nordcraft/core/dist/utils/json'

const handler: FormulaHandler<unknown> = ([data]) => {
  if (typeof data !== 'string') {
    return null
  }
  try {
    // Similar to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
    return parseJSONWithDate(data)
  } catch {
    return null
  }
}
export default handler
