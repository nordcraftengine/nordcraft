import type { ActionHandler } from '@nordcraft/core'
import { validateCookieArgs } from '../setCookie/cookieUtils'

const handler: ActionHandler = async function (args, ctx) {
  const error = (message: string) =>
    ctx.triggerActionEvent('Error', new Error(message))

  const options = validateCookieArgs(args, error)
  if (!options) {
    return
  }
  const { name, value, sameSite, path, includeSubdomains, ttl } = options
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
