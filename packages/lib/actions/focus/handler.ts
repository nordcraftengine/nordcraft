import type { ActionHandler } from '@nordcraft/core/dist/types'
import { toBoolean } from '@nordcraft/core/dist/utils/util'

const handler: ActionHandler = ([elem, preventScroll]) => {
  if (elem instanceof HTMLElement) {
    elem.focus({
      preventScroll: toBoolean(preventScroll),
    })
  }
}

export default handler
