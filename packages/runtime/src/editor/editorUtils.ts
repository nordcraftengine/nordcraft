export const debounce = (func: () => void, wait: number, immediate = false) => {
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined
  return () => {
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func()
    }, wait)
    if (callNow) {
      func()
    }
  }
}

export const throttleToIdleCallback = (func: () => void) => {
  let scheduled = false
  return () => {
    if (!scheduled) {
      scheduled = true
      ;(globalThis.requestIdleCallback ?? globalThis.requestAnimationFrame)(
        () => {
          func()
          scheduled = false
        },
      )
    }
  }
}
