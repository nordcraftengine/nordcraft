import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown>> = ([list]) => {
  if (!Array.isArray(list)) {
    return null
  }
  const set = new Set()
  return list.filter((item) => {
    const key = typeof item === 'object' ? JSON.stringify(item) : item
    if (set.has(key)) {
      return false
    }
    set.add(key)
    return true
  })
}

export default handler
