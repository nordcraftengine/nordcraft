import type { ToddleInternals } from '@nordcraft/core/dist/types'

declare global {
  interface Window {
    __toddle?: ToddleInternals
    __e2e?: {
      ready: boolean
      error: string | null
    }
    __cookieChangeListeners?: number
  }
}

export {}
