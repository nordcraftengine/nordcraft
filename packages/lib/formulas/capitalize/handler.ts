import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = ([input]) => {
  if (typeof input !== 'string') {
    return null
  }
  const firstChar = input.at(0)

  if (input.length === 0 || typeof firstChar !== 'string') {
    return input
  }
  return firstChar.toLocaleUpperCase() + input.substring(1).toLocaleLowerCase()
}

export default handler
