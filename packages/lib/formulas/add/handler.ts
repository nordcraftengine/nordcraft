import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = (numbers) => {
  if (!Array.isArray(numbers)) {
    return null
  }

  let sum = 0
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i]
    if (typeof n !== 'number') {
      return null
    }
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition
    sum += n
  }
  return sum
}

export default handler
