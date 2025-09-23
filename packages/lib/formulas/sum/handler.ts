import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = ([list]) => {
  if (Array.isArray(list)) {
    let sum = 0
    for (const n of list) {
      if (isNaN(n) || typeof n !== 'number') {
        return null
      }
      sum += n
    }
    return sum
  }
  return null
}

export default handler
