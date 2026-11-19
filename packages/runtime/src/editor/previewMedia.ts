const LAZY_MEDIA_SELECTOR = 'img[loading="lazy"], iframe[loading="lazy"]'

const isLazyMedia = (node: Node): node is Element =>
  node instanceof Element && node.matches(LAZY_MEDIA_SELECTOR)

const loadEagerly = (element: Element) => {
  element.setAttribute('loading', 'eager')
}

const loadAllEagerly = (root: ParentNode) => {
  root.querySelectorAll(LAZY_MEDIA_SELECTOR).forEach(loadEagerly)
}

const isMediaElement = (target: EventTarget | null) =>
  target instanceof HTMLImageElement ||
  target instanceof HTMLIFrameElement ||
  target instanceof HTMLMediaElement

/**
 * The editor canvas grows to fit the page, but the browser only loads lazy
 * images and iframes once they are close to the visible part of the editor
 * window. Media further down the page is outside the canvas, so it never
 * loads, and the page (and therefore the canvas) stays shorter than it really
 * is until something else triggers a new measurement.
 *
 * To avoid this, lazy media inside the preview is switched to load straight
 * away (including media that is added or changed later), and `onMediaLoaded`
 * is called whenever media inside the page finishes loading (or fails to), so
 * the canvas can be measured again. The ResizeObserver on the root element
 * doesn't catch this when the root element itself keeps its size.
 *
 * Returns a function that stops watching.
 */
export const watchPreviewMedia = (
  domNode: HTMLElement,
  onMediaLoaded: () => void,
) => {
  loadAllEagerly(domNode)

  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (isLazyMedia(mutation.target)) {
          loadEagerly(mutation.target)
        }
        continue
      }
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          if (isLazyMedia(node)) {
            loadEagerly(node)
          }
          loadAllEagerly(node)
        }
      })
    }
  })
  mutationObserver.observe(domNode, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['loading'],
  })

  // Media events don't bubble, so listen in the capture phase to catch them
  // from any element inside the page
  const handleMediaEvent = (event: Event) => {
    if (isMediaElement(event.target)) {
      onMediaLoaded()
    }
  }
  const mediaEvents = ['load', 'error', 'loadedmetadata'] as const
  mediaEvents.forEach((eventName) =>
    domNode.addEventListener(eventName, handleMediaEvent, true),
  )

  return () => {
    mutationObserver.disconnect()
    mediaEvents.forEach((eventName) =>
      domNode.removeEventListener(eventName, handleMediaEvent, true),
    )
  }
}
