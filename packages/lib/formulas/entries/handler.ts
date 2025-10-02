import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<{ key: string; value: unknown }>> = ([
  object,
]) => {
  if (typeof object === 'object' && object !== null) {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    return Object.entries(object).map(([key, value]) => ({ key, value }))
  }
  return null
}

export default handler
