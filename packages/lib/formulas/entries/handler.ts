import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<Array<{ key: string; value: unknown }>> = ([
  object,
]) => {
  if (typeof object === 'object' && object !== null) {
    const res: Array<{ key: string; value: unknown }> = []
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        res.push({ key, value: (object as any)[key] })
      }
    }
    return res
  }
  return null
}

export default handler
