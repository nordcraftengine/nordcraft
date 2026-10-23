import type { ActionHandler } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

const handler: ActionHandler = ([delay], ctx) => {
  // We'll cast delay in case it's passed as a string
  const delayNumber = Number(delay)
  if (!isDefined(delay) || Number.isNaN(delay)) {
    throw new Error('Invalid delay value')
  }
  const interval = setInterval(
    () => ctx.triggerActionEvent('tick', null),
    delayNumber,
  )
  ctx.abortSignal.addEventListener('abort', () => {
    clearInterval(interval)
  })
}

export default handler
