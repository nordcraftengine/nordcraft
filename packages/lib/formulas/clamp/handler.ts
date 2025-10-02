import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([value, min, max]) => {
  if (typeof value !== 'number') {
    return null
  }
  if (typeof min !== 'number') {
    return null
  }
  if (typeof max !== 'number') {
    return null
  }
  return Math.min(Math.max(value, min), max)
}

export default handler
