import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<boolean> = (_, ctx) => {
  return ctx.env.isServer
}

export default handler
