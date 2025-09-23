import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = (numbers) => {
  if (numbers.some((n) => isNaN(Number(n)))) {
    return null
  }
  return (numbers as number[]).reduce<number>(
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication
    (product, num) => product * num,
    1,
  )
}

export default handler
