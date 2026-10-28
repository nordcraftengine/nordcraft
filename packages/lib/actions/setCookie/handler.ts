import type { ActionHandler } from '@nordcraft/core'
import { validateCookieArgs } from './cookieUtils'

const handler: ActionHandler = async function (args, ctx) {
  const options = validateCookieArgs(args, (message) =>
    ctx.triggerActionEvent('Error', new Error(message)),
  )
  if (!options) {
    return
  }
  const { name, value, sameSite, path, includeSubdomains, ttl } = options
  let cookie = `${name}=${value}; Secure; SameSite=${sameSite}; Path=${path}`
  if (typeof ttl === 'number') {
    const date = new Date(Date.now() + ttl * 1000)
    cookie += `; Expires=${date.toUTCString()}`
  }
  if (includeSubdomains) {
    cookie += `; Domain=${window.location.hostname}`
  }
  document.cookie = cookie
  ctx.triggerActionEvent('Success', undefined)
}

export default handler
