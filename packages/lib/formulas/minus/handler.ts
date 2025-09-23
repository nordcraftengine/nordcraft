import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([a, b]) => {
  const first = Number(a)
  const second = Number(b)
  if (isNaN(first) || isNaN(second)) {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction
  return first - second
}

export default handler
