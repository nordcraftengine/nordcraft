export function isElementInViewport(element: HTMLElement, offset = 0): boolean {
  const rect = element.getBoundingClientRect()
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth

  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= viewportHeight + offset &&
    rect.right <= viewportWidth + offset
  )
}
