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

export const getFormattedTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeStyle: 'long',
  }).format(new Date())
