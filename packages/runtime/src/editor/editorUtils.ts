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
