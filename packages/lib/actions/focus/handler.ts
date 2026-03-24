import type { ActionHandler } from '@nordcraft/core/dist/types'

const handler: ActionHandler = ([elem, preventScroll]) => {
  if (elem instanceof HTMLElement) {
    if (typeof preventScroll === 'boolean') {
      elem.focus({
        preventScroll,
      })
    } else {
      elem.focus()
    }
  }
}

export default handler
