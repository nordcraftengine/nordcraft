import type { ActionHandler } from '@nordcraft/core'

const handler: ActionHandler = async function () {
  window.localStorage.clear()
}

export default handler
