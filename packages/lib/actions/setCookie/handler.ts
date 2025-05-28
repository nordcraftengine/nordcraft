import type { ActionHandler } from '@nordcraft/core/dist/types'

const handler: ActionHandler = async function (
  [name, value, ttl, _sameSite, _path, _includeSubdomains],
  ctx,
) {
  const error = (message: string) =>
    ctx.triggerActionEvent('Error', new Error(message))
  if (typeof name !== 'string') {
    error('The "Name" argument must be a string')
    return
  }
  if (typeof value !== 'string') {
    error('The "Value" argument must be a string')
    return
  }
  const sameSite = _sameSite ?? 'Lax' // Default value
  if (
    typeof sameSite !== 'string' ||
    !['lax', 'strict', 'none'].includes(sameSite.toLocaleLowerCase())
  ) {
    error('The "SameSite" argument must be "Lax", "Strict" or "None"')
    return
  }
  const path = _path ?? '/' // Default value
  if (typeof path !== 'string' || !path.startsWith('/')) {
    error('The "Path" argument must be a string and start with /')
    return
  }
  if (
    ttl !== undefined &&
    ttl !== null &&
    (typeof ttl !== 'number' || isNaN(ttl))
  ) {
    error('The "Expires in" argument must be a number')
    return
  }
  const includeSubdomains = _includeSubdomains ?? true // Default value
  if (typeof includeSubdomains !== 'boolean') {
    error('The "Include Subdomains" argument must be a boolean')
    return
  }
  // The cookie will always be set to Secure. Anything else can be configured
  let cookie = `${name}=${value}; SameSite=${sameSite}; Path=${path}`
  // If no ttl is set, the cookie will be a session cookie
  if (typeof ttl === 'number') {
    const date = new Date(Date.now() + ttl * 1000)
    cookie += `; Expires=${date.toUTCString()}`
  }
  if (includeSubdomains) {
    // When the domain is set, the cookie is also available to subdomains - otherwise
    // it is only available on the current domain
    cookie += `; Domain=${window.location.hostname}`
  }
  document.cookie = cookie
  ctx.triggerActionEvent('Success', undefined)
}

export default handler
