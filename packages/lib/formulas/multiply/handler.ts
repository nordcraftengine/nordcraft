import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = (numbers) => {
  if (!Array.isArray(numbers)) {
    return null
  }
  let product = 1
  for (let i = 0; i < numbers.length; i++) {
    const num = Number(numbers[i])
    if (isNaN(num)) {
      return null
    }
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication
    product *= num
  }
  return product
}

export default handler
