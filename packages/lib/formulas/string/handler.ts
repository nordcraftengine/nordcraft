import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 */
const handler: FormulaHandler<string> = ([input]) => String(input)

export default handler
