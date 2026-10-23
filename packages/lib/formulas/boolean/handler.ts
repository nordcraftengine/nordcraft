import type { FormulaHandler } from '@nordcraft/core'
import { toBoolean } from '@nordcraft/core'

const handler: FormulaHandler<boolean> = ([input]) => {
  return toBoolean(input)
}

export default handler
