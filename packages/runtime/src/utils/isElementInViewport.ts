export function isElementInViewport(
  element: HTMLElement,
  thresholdPx = 0,
): boolean {
  const rect = element.getBoundingClientRect()
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth

  return (
    rect.top >= 0 - thresholdPx &&
    rect.left >= 0 - thresholdPx &&
    rect.bottom <= viewportHeight + thresholdPx &&
    rect.right <= viewportWidth + thresholdPx
  )
}
