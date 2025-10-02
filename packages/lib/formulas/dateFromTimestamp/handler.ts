import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Date> = ([timestamp]) => {
  if (typeof timestamp === 'number') {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
    return new Date(timestamp)
  } else {
    return null
  }
}

export default handler
