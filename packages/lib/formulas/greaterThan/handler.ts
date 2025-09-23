import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<boolean> = ([first, second]: any[]) => {
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Greater_than
  return first > second
}

export default handler
