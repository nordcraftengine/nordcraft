import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([a]) => {
  // Check if input is not a number or is null
  if (typeof a !== 'number' || Number.isNaN(a)) {
    return null
  }
  // Number must be greater than or equal to 0
  if (a < 0) {
    return null
  }

  return Math.log(a)
}

export default handler
