import {
  DATA_ATTR_ID,
  DATA_ID_PREVIEW_RESOURCE,
  SELECTOR_PREVIEW_RESOURCE,
} from './const'
import { requestResizeCanvas } from './resizeCanvas'

export const applyPreviewResources = (
  resources: ReadonlyArray<{ href: string }>,
  options: {
    resizeCanvasOptions: {
      viewport?: { height: number | null }
      enabled?: boolean
    }
    syncOverlayRects: () => void
  },
) => {
  // Allow for temporarily adding preview resources (e.g. fonts).
  const resourceElements = Array.from(
    document.head.querySelectorAll(SELECTOR_PREVIEW_RESOURCE),
  )
  // Remove any resources that are no longer needed
  resourceElements.forEach((el) => {
    if (
      resources.length === 0 ||
      !resources.some((res) => res.href === el.getAttribute('href'))
    ) {
      el.remove()
    }
  })
  resources
    .filter(
      (resource) =>
        !resourceElements.some(
          (el) => el.getAttribute('href') === resource.href,
        ),
    )
    .forEach((resource) => {
      const resourceElement = document.createElement('link')
      resourceElement.setAttribute(DATA_ATTR_ID, DATA_ID_PREVIEW_RESOURCE)
      resourceElement.rel = 'stylesheet'
      resourceElement.href = resource.href
      document.head.appendChild(resourceElement)

      // Sync canvas after the resource has loaded (if not already loaded)
      if (!resourceElement.sheet) {
        resourceElement.addEventListener('load', () => {
          requestResizeCanvas(
            options.resizeCanvasOptions,
            options.syncOverlayRects,
          )
        })
      }
    })
  requestResizeCanvas(options.resizeCanvasOptions, options.syncOverlayRects)
}
