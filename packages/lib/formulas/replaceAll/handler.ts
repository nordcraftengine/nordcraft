import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = ([
  input,
  searchValue,
  replaceValue,
]) => {
  if (typeof input !== 'string') {
    return null
  }
  if (typeof searchValue !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll
  return input.replaceAll(searchValue, String(replaceValue))
}

export default handler
