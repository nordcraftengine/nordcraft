import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<unknown> = ([list]) => {
  if (typeof list === 'string' || Array.isArray(list)) {
    return list[0]
  }
  return null
}

export default handler
