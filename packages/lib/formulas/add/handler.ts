import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = (numbers) => {
  if (
    !Array.isArray(numbers) ||
    numbers.some((n) => n === null || typeof n !== 'number')
  ) {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition
  return numbers.reduce((result: number, n: any) => {
    return result + Number(n)
  }, 0)
}

export default handler
