import type { FormulaHandler } from '@nordcraft/core/dist/types'

let idCounter = 0
const handler: FormulaHandler<string> = () => {
  return `_id_${idCounter++}_`
}

export default handler
