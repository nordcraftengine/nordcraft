import type { ActionHandler } from '@nordcraft/core'

const handler: ActionHandler = ([value]) => {
  if (typeof value !== 'string') {
    throw new Error(`Input value must be a string`)
  }
  return navigator.clipboard.writeText(value)
}

export default handler
