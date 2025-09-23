import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown> | string> = ([list, count]) => {
  if (typeof count !== 'number') {
    return null
  }
  if (Array.isArray(list)) {
    return list.slice(list.length - count)
  }
  if (typeof list === 'string') {
    return list.substring(list.length - count)
  }
  return null
}

export default handler
