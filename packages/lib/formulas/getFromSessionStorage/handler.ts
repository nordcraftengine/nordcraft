import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<unknown> = ([key]) => {
  if (typeof key !== 'string' || key.length === 0) {
    return null
  }
  if (typeof window === 'undefined') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
  const value = window.sessionStorage.getItem(key)
  if (value === null) {
    return value
  }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export default handler
