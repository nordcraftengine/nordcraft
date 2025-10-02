import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = () => {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  return Math.random()
}

export default handler
