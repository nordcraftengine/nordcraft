import type { FormulaHandler } from '@nordcraft/core/dist/types'

let localCounter = 0
const requestCounters = new WeakMap<object, { idCounter: number }>()
function getRequestCounter(key: object) {
  if (!requestCounters.has(key)) {
    requestCounters.set(key, { idCounter: 0 })
  }
  return requestCounters.get(key)!
}

const handler: FormulaHandler<string> = (_, ctx) => {
  if (ctx.env.isServer) {
    const counter = getRequestCounter(ctx.env.request)
    return `_id_${counter.idCounter++}_`
  }

  return `_id_${localCounter++}_`
}

export default handler
