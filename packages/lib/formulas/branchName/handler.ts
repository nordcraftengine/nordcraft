import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<string> = (_, ctx) => {
  return ctx.env.branchName
}

export default handler
