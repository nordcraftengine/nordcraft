import type { ActionHandler } from '@nordcraft/core/dist/types'
import { isDefined } from '@nordcraft/core/dist/utils/util'

const handler: ActionHandler = ([delay], ctx) => {
  // We'll cast delay in case it's passed as a string
  const delayNumber = Number(delay)
  if (!isDefined(delay) || Number.isNaN(delay)) {
    throw new Error('Invalid delay value')
  }
  const timeout = setTimeout(
    () => ctx.triggerActionEvent('tick', null),
    delayNumber,
  )
  ctx.abortSignal.addEventListener('abort', () => {
    clearTimeout(timeout)
  })
}

export default handler
