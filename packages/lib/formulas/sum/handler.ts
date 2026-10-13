import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<number> = (args) => {
  const list = args[0]
  if (Array.isArray(list)) {
    let sum = 0
    for (let i = 0; i < list.length; i++) {
      const n = list[i]
      if (typeof n !== 'number' || isNaN(n)) {
        return null
      }
      sum += n
    }
    return sum
  }
  return null
}

export default handler
