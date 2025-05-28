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
  const params = new URLSearchParams()
  params.set('name', name)
  params.set('value', value)
  params.set('sameSite', sameSite)
  params.set('path', path)
  params.set('includeSubdomains', String(includeSubdomains))
  if (typeof ttl === 'number') {
    params.set('ttl', String(ttl))
  }
  try {
    const res = await fetch(
      `/.nordcraft/cookies/set-cookie?${params.toString()}`,
    )
    if (res.ok) {
      ctx.triggerActionEvent('Success', undefined)
    } else {
      error(await res.text())
    }
  } catch (err) {
    error(err instanceof Error ? err.message : 'An unexpected error occurred')
  }
}

export default handler
