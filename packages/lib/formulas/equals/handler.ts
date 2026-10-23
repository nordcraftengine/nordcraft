import type { FormulaHandler } from '@nordcraft/core'
const handler: FormulaHandler<boolean> = ([a, b]) => {
  return (globalThis as any).toddle.isEqual(a, b)
}

export default handler
