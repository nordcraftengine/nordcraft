import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
 */
const handler: FormulaHandler<string> = ([value]) => {
  switch (typeof value) {
    case 'number':
      if (isNaN(value)) {
        return null
      }
      return 'Number'
    case 'string':
      return 'String'
    case 'boolean':
      return 'Boolean'
    case 'object':
      return Array.isArray(value) ? 'Array' : value === null ? 'Null' : 'Object'
    case 'undefined':
      return 'Null'
    default:
      return null
  }
}

export default handler
