import { CSS_VAR_SCROLL_HEIGHT } from './const'
import { postMessageToEditor } from './postMessageToEditor'

let _lastScrollHeight = 0
function resizeCanvas({
  force,
  viewport,
}: {
  force: boolean
  viewport: { height: number }
}) {
  const domNode = document.getElementById('App')!

  // First pass: Set base height to resolve relative units the same way each render
  domNode.style.maxHeight = `${viewport.height}px`

  // Force reflow
  void domNode.offsetHeight

  // Measure the actual content size
  const scrollHeight = Math.max(domNode.scrollHeight, viewport.height)

  // Update viewport height ratio for vh to work inside the canvas
  domNode.style.setProperty(CSS_VAR_SCROLL_HEIGHT, String(scrollHeight))

  // Restore original styles
  domNode.style.removeProperty('max-height')

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
export const requestResizeCanvas = (
  options: {
    enabled?: boolean
    force?: boolean
    viewport?: { height: number | null }
  } = {},
) => {
  if (cancelRequestResizeCanvas) {
    cancelAnimationFrame(cancelRequestResizeCanvas)
  }

  if (options.enabled === false) {
    return
  }

  requestAnimationFrame(() => {
    resizeCanvas({
      force: options.force ?? false,
      viewport: {
        height: options.viewport?.height ?? 740,
      },
    })
    cancelRequestResizeCanvas = null
  })
}
