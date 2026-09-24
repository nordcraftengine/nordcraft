import { CSS_VAR_SCROLL_HEIGHT } from './const'
import { postMessageToEditor } from './postMessageToEditor'

export type ResizeCanvasOptions = {
  enabled?: boolean
  force?: boolean
  viewport?: { height: number | null }
}

let _lastScrollHeight = 0
function _resizeCanvas({
  force,
  viewport,
}: {
  force: boolean
  viewport: { height: number }
}) {
  const domNode = document.getElementById('App')!

  // First pass: Set base height to resolve relative units the same way each render
  domNode.style.maxHeight = `${viewport.height}px`

  // Temporarily set the scroll height variable to the actual window height
  // so that vh units resolve relative to the simulated viewport height
  domNode.style.setProperty(
    CSS_VAR_SCROLL_HEIGHT,
    String(Math.round(window.innerHeight)),
  )

  // Force reflow
  void domNode.offsetHeight

  // Measure the actual content size
  const scrollHeight = Math.round(
    Math.max(domNode.scrollHeight, viewport.height),
  )

  // Update viewport height ratio for vh to work inside the canvas
  domNode.style.setProperty(CSS_VAR_SCROLL_HEIGHT, String(scrollHeight))

  // Restore original styles
  domNode.style.removeProperty('max-height')

  // Force reflow after restoring max-height so subsequent measurements see the restored state
  void domNode.offsetHeight

  if (!force && scrollHeight === _lastScrollHeight) {
    return
  }

  _lastScrollHeight = scrollHeight
  postMessageToEditor({
    type: 'documentScrollSize',
    scrollHeight,
  })
}

let cancelRequestResizeCanvas: number | null = null
let pendingCallbacks: Array<() => void> = []

const flushPendingCallbacks = () => {
  const callbacks = pendingCallbacks
  pendingCallbacks = []
  callbacks.forEach((cb) => cb())
}

/**
 * Resizes the canvas synchronously.
 * Updates CSS_VAR_SCROLL_HEIGHT immediately and notifies the editor if scrollHeight changed.
 * Any pending rAF resize request is cancelled and all pending callbacks are flushed.
 */
export const resizeCanvas = (options: ResizeCanvasOptions = {}) => {
  if (cancelRequestResizeCanvas) {
    cancelAnimationFrame(cancelRequestResizeCanvas)
    cancelRequestResizeCanvas = null
  }

  if (options.enabled === false) {
    flushPendingCallbacks()
    return
  }

  _resizeCanvas({
    force: options.force ?? false,
    viewport: { height: options.viewport?.height ?? 740 },
  })

  flushPendingCallbacks()
}

/**
 * Requests an asynchronous canvas resize scheduled on the next animation frame.
 * Multiple requests within the same frame are coalesced, and all onDone callbacks are preserved.
 */
export const requestResizeCanvas = (
  options: ResizeCanvasOptions = {},
  onDone?: () => void,
) => {
  if (onDone) {
    pendingCallbacks.push(onDone)
  }

  if (options.enabled === false) {
    if (cancelRequestResizeCanvas) {
      cancelAnimationFrame(cancelRequestResizeCanvas)
      cancelRequestResizeCanvas = null
    }
    flushPendingCallbacks()
    return
  }

  if (cancelRequestResizeCanvas) {
    cancelAnimationFrame(cancelRequestResizeCanvas)
  }

  cancelRequestResizeCanvas = requestAnimationFrame(() => {
    cancelRequestResizeCanvas = null
    _resizeCanvas({
      force: options.force ?? false,
      viewport: { height: options.viewport?.height ?? 740 },
    })
    flushPendingCallbacks()
  })
}
