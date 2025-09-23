import { STRING_TEMPLATE } from '@nordcraft/core/dist/api/template'
import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * Nordcraft uses a custom string template to replace HttpOnly cookies server-side.
 * Learn more about cookies here https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
 */
const handler: FormulaHandler<string> = ([name]) => {
  if (!name || typeof name !== 'string') {
    return null
  }
  return STRING_TEMPLATE('cookies', name)
}

export default handler
