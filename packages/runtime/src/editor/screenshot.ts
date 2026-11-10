/* eslint-disable no-console */
import { domToCanvas, waitUntilLoad } from 'modern-screenshot'
import { postMessageToEditor } from './postMessageToEditor'
import { waitForViewportWidth } from './viewportWidth'

// Applies to both waiting for media and fetching each embedded asset. The
// library default (30s) lets a single slow asset exceed the editor's own
// timeout.
const SCREENSHOT_TIMEOUT_MS = 5000

export const captureScreenshot = async (data: {
  id: string
  viewportWidth?: number
}) => {
  const { id, viewportWidth } = data
  let disableTransitionsStyle: HTMLStyleElement | null = null
  // Set only if we actually ask the editor to resize, so we can ask
  // it to put the width back afterwards - we can't rely on the
  // editor's own restore logic getting this right.
  let widthToRestore: number | null = null
  // modern-screenshot waits for every <img> in the document to load before
  // cloning. Off-screen lazy images never load, so each would stall the
  // capture for the full timeout. Switch them to eager for the capture.
  const lazyImages = Array.from(
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'),
  )
  try {
    if (viewportWidth !== undefined) {
      if (window.innerWidth !== viewportWidth) {
        // We can't resize our own <iframe> element from in here - the
        // preview iframe is cross-origin/sandboxed from the editor, so
        // `window.frameElement` isn't accessible. Ask the editor to
        // resize the actual iframe instead, then wait for the
        // resulting native `resize` event rather than requiring an
        // explicit reply.
        widthToRestore = window.innerWidth
        postMessageToEditor({
          type: 'requestViewportWidth',
          width: viewportWidth,
        })
        await waitForViewportWidth(viewportWidth)
      }

      // The editor's resize may have triggered CSS transitions on
      // responsive layout changes; disable them so we capture the
      // resting state at this width rather than a half-finished
      // transition frame.
      disableTransitionsStyle = document.createElement('style')
      disableTransitionsStyle.textContent =
        '*, *::before, *::after { transition: none !important; animation: none !important; }'
      document.head.appendChild(disableTransitionsStyle)

      // Let layout settle at the new width before capturing -
      // getComputedStyle (used internally by domToCanvas) forces a
      // synchronous layout flush, but a frame gives any resize-driven
      // JS (ResizeObserver, matchMedia listeners, etc.) a chance to run.
      await new Promise(requestAnimationFrame)
    }

    // Rasterize the full document (not just what's currently scrolled into
    // view) by walking the DOM/computed styles rather than capturing the
    // screen, so content below the fold is still included.
    const target = document.documentElement
    for (const img of lazyImages) {
      img.loading = 'eager'
    }
    // Wait for media before measuring, since images without intrinsic
    // dimensions change the document size once they load.
    await waitUntilLoad(target, { timeout: SCREENSHOT_TIMEOUT_MS })
    const canvas = await domToCanvas(target, {
      width: target.scrollWidth,
      height: target.scrollHeight,
      timeout: SCREENSHOT_TIMEOUT_MS,
    })
    const url = canvas.toDataURL('image/png')

    postMessageToEditor({
      type: 'screenshot',
      id,
      file: {
        type: 'image/png',
        size: url.length,
        dimensions: { width: canvas.width, height: canvas.height },
        url,
      },
    })
  } catch (error) {
    postMessageToEditor({
      type: 'screenshot',
      id,
      file: null,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    for (const img of lazyImages) {
      img.loading = 'lazy'
    }
    disableTransitionsStyle?.remove()
    if (widthToRestore !== null) {
      postMessageToEditor({
        type: 'requestViewportWidth',
        width: widthToRestore,
      })
      try {
        await waitForViewportWidth(widthToRestore)
      } catch (error) {
        console.error('Failed to restore original viewport width', error)
      }
    }
  }
}
