import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([a, b]) => {
  if (isNaN(Number(a)) || isNaN(Number(b))) {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
  return Number(a) % Number(b)
}
export default handler
