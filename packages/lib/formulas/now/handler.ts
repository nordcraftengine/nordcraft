import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<Date> = () => {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  return new Date()
}

export default handler
