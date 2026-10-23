import type { ActionHandler } from '@nordcraft/core'

const handler: ActionHandler = async function ([access_token, ttl], ctx) {
  const query = [
    typeof access_token === 'string'
      ? `name=access_token&value=${encodeURIComponent(access_token)}`
      : undefined,
    isNaN(Number(ttl)) ? undefined : `ttl=${ttl}`,
  ]
    .filter((a) => a)
    .join('&')
  const res = await fetch(`/.toddle/cookies/set-session-cookie?${query}`)
  if (res.ok) {
    ctx.triggerActionEvent('Success', undefined)
  } else {
    ctx.triggerActionEvent('Error', new Error(await res.text()))
  }
}

export default handler
