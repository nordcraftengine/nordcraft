import type { Toddle } from '@nordcraft/core'
import { deepEquals } from '@nordcraft/core'

export const initIsEqual = () => {
  const toddle: Pick<Toddle<never, never>, 'isEqual'> = {
    isEqual: deepEquals,
  }
  ;(globalThis as any).toddle = toddle
}
