import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<HTMLElement> = ([id], { root }) => {
  if (typeof id !== 'string') {
    return null
  }
  // See https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
  return root.getElementById(id)
}

export default handler
