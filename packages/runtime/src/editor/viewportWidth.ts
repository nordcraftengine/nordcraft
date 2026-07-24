/**
 * Resolves once `window.innerWidth` matches `width`, or rejects if it hasn't
 * happened within `timeoutMs`. Resizing our own iframe element has to happen
 * on the editor side (same-origin policy prevents us from doing it directly),
 * so this observes the native `resize` event fired once the editor applies it
 * rather than requiring an explicit reply message from the editor.
 */
export const waitForViewportWidth = (
  width: number,
  timeoutMs = 2000,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.innerWidth === width) {
      resolve()
      return
    }

    const cleanup = () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timeoutId)
    }
    const onResize = () => {
      if (window.innerWidth === width) {
        cleanup()
        resolve()
      }
    }
    const timeoutId = setTimeout(() => {
      cleanup()
      reject(
        new Error(
          `Timed out waiting for the editor to resize the iframe to ${width}px (currently ${window.innerWidth}px)`,
        ),
      )
    }, timeoutMs)
    window.addEventListener('resize', onResize)
  })
