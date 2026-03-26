import type { ActionHandler } from '@nordcraft/core/dist/types'
import { toBoolean } from '@nordcraft/core/dist/utils/util'

const handler: ActionHandler = ([elem, preventScroll]) => {
  if (elem instanceof HTMLElement) {
    if (preventScroll) {
      elem.focus({
        preventScroll: toBoolean(preventScroll),
      })
    } else {
      elem.focus()
    }
  }
}

export default handler
