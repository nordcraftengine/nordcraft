import type { FormulaHandler } from '@nordcraft/core/dist/types'

/**
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
 * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
 */
const handler: FormulaHandler<boolean> = (args) => {
  const collection = args[0]
  const item = args[1]
  if (typeof collection === 'string') {
    return typeof item === 'string' ? collection.includes(item) : null
  }
  if (Array.isArray(collection)) {
    if (collection.includes(item)) {
      return true
    }

    const isEqual = (globalThis as any).toddle.isEqual
    for (let i = 0; i < collection.length; i++) {
      if (isEqual(collection[i], item)) {
        return true
      }
    }
    return false
  }
  return null
}

export default handler
