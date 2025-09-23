import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = ([URIComponent]) => {
  if (typeof URIComponent !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
  return encodeURIComponent(URIComponent)
}

export default handler
