import type { FormulaHandler } from '@nordcraft/core/dist/types'
const handler: FormulaHandler<string> = ([data, indent]) => {
  if (typeof indent !== 'number') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  return JSON.stringify(data, null, indent)
}
export default handler
