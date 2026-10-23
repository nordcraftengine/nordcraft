import '@nordcraft/core/compileTime'
import type { ActionHandler } from '@nordcraft/core'

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
