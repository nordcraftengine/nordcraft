import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<unknown>> = ([list, value]) => {
  if (!Array.isArray(list)) {
    return null
  }
  return [value, ...list]
}

export default handler
