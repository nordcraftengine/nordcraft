import type { ActionHandler } from '@nordcraft/core'

const handler: ActionHandler = async function () {
  window.sessionStorage.clear()
}

export default handler
