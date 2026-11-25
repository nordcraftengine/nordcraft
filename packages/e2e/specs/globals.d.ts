import type {
  PageComponentsData,
  PageStateData,
} from '@nordcraft/core/dist/types'

declare global {
  interface Window {
    __toddle?: PageComponentsData &
      PageStateData & {
        isPageLoaded: boolean
      }
    __e2e?: {
      ready: boolean
      error: string | null
    }
    __cookieChangeListeners?: number
  }
}

export {}
