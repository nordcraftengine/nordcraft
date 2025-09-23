import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([input, decimals]) => {
  if (typeof input !== 'number') {
    return null
  }
  if (typeof decimals !== 'number') {
    return null
  }
  const multiplier = Math.max(1, Math.pow(10, decimals))
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
  return Math.round(input * multiplier) / multiplier
}

export default handler
