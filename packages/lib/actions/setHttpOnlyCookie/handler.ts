import type { ActionHandler } from '@nordcraft/core/dist/types'

const handler: ActionHandler = async function (
  [name, value, ttl, sameSite = 'Lax', path = '/'],
  ctx,
) {
  if (typeof name !== 'string') {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "Name" argument must be a string'),
    )
    return
  }
  if (typeof value !== 'string') {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "Value" argument must be a string'),
    )
    return
  }
  if (
    typeof sameSite !== 'string' ||
    !['lax', 'strict', 'none'].includes(sameSite.toLocaleLowerCase())
  ) {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "SameSite" argument must be "Lax", "Strict" or "None"'),
    )
    return
  }
  if (typeof path !== 'string' || !path.startsWith('/')) {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "Path" argument must be a string and start with /'),
    )
    return
  }
  if (
    ttl !== undefined &&
    ttl !== null &&
    (typeof ttl !== 'number' || isNaN(ttl))
  ) {
    ctx.triggerActionEvent(
      'Error',
      new Error('The "Expires in" argument must be a number'),
    )
    return
  }
  const params = new URLSearchParams()
  params.set('name', name)
  params.set('value', value)
  params.set('sameSite', sameSite)
  params.set('path', path)
  if (typeof ttl === 'number') {
    params.set('ttl', String(ttl))
  }
  try {
    const res = await fetch(
      `/.toddle/cookies/set-session-cookie?${params.toString()}`,
    )
    if (res.ok) {
      ctx.triggerActionEvent('Success', undefined)
    } else {
      ctx.triggerActionEvent('Error', new Error(await res.text()))
    }
  } catch (error) {
    ctx.triggerActionEvent('Error', error)
  }
}

export default handler
