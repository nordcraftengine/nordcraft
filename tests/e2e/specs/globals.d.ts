declare global {
  interface Window {
    __e2e?: {
      ready: boolean
      error: string | null
    }
  }
}

export {}
