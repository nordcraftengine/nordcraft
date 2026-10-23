import type { ActionHandler } from '@nordcraft/core'
import { toBoolean } from '@nordcraft/core'

const handler: ActionHandler = ([elem, preventScroll]) => {
  if (elem instanceof HTMLElement) {
    elem.focus({
      preventScroll: toBoolean(preventScroll),
    })
  }
}

export default handler
