import type { FormulaHandler } from '@nordcraft/core'
import { toBoolean } from '@nordcraft/core'

const handler: FormulaHandler<boolean> = ([a]) => !toBoolean(a)

export default handler
