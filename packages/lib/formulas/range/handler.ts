import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<number>> = ([min, max]) => {
  if (typeof min !== 'number') {
    return null
  }
  if (typeof max !== 'number') {
    return null
  }
  if (min > max) {
    return []
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
  return Array.from({ length: max - min + 1 }, (_, i) => i + min)
}

export default handler
