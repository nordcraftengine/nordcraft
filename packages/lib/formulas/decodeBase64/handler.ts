import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<string> = ([input]) => {
  if (typeof input !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob
  return atob(input)
}

export default handler
