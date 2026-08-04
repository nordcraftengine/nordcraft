import type { Toddle } from '@nordcraft/core/dist/types'
import { deepEqual as isEqual } from 'fast-equals'

export const initIsEqual = () => {
  const toddle: Pick<Toddle<never, never>, 'isEqual'> = {
    isEqual,
  }
  ;(globalThis as any).toddle = toddle
}
