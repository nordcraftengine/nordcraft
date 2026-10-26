import type { Toddle } from '@nordcraft/core'
import fastDeepEqual from 'fast-deep-equal'

export const initIsEqual = () => {
  const toddle: Pick<Toddle<never, never>, 'isEqual'> = {
    isEqual: fastDeepEqual,
  }
  ;(globalThis as any).toddle = toddle
}
