import type { FormulaHandler } from '@nordcraft/core'
import { toBoolean } from '@nordcraft/core'

const handler: FormulaHandler<unknown> = (values) => {
  for (const value of values) {
    if (toBoolean(value)) {
      return value
    }
  }
  return null
}

export default handler
