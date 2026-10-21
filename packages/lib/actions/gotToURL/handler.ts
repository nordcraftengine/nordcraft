import '@nordcraft/core/dist/compileTime'
import type { ActionHandler } from '@nordcraft/core/dist/types'

const handler: ActionHandler = ([url]) => {
  if (typeof url === 'string') {
    if (IS_PREVIEW) {
      // Attempt to notify the parent about the failed navigation attempt
      window.parent?.postMessage({ type: 'blockedNavigation', url }, '*')
    } else {
      window.location.href = url
    }
  }
}

export default handler
