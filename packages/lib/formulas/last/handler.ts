import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<unknown> = ([list]) => {
  if (typeof list === 'string' || Array.isArray(list)) {
    return list[list.length - 1]
  }
  return null
}

export default handler
