import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Date> = ([date]) => {
  if (typeof date === 'string') {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
    return new Date(date)
  } else {
    return null
  }
}

export default handler
