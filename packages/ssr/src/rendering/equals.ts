import type { Nordcraft } from '@nordcraft/core/dist/types'
import fastDeepEqual from 'fast-deep-equal'

export const initIsEqual = () => {
  const toddle: Pick<Nordcraft<never, never>, 'isEqual'> = {
    isEqual: fastDeepEqual,
  }
  ;(globalThis as any).toddle = toddle
}
