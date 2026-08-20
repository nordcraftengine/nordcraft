const OVERLAP_OFFSET_PX = 100

/**
 * Return the most likely permutation to move the dragged element to based on the current drag position.
 * The calculation is based on distance from the center of the dragged element to the center of the potential target element,
 * but only if the dragged element is overlapping with the target element.
 */
export function getBestPermutation(
  element: HTMLElement,
  reorderPermutations: Array<{
    nextSibling: Node | null
    rect: DOMRect
  }>,
) {
  const { left, top, width, height } = element.getBoundingClientRect()
  const dragElementCenterX = left + width / 2
  const dragElementCenterY = top + height / 2
  return reorderPermutations.reduce<null | {
    rect: DOMRect
    nextSibling: Node | null
  }>((prev, curr) => {
    const isOverlapping =
      Math.abs(curr.rect.left + curr.rect.width / 2 - dragElementCenterX) <
        curr.rect.width / 2 + OVERLAP_OFFSET_PX &&
      Math.abs(curr.rect.top + curr.rect.height / 2 - dragElementCenterY) <
        curr.rect.height / 2 + OVERLAP_OFFSET_PX
    if (isOverlapping) {
      if (!prev) {
        return curr
      }

      const prevDist = Math.hypot(
        prev.rect.left + prev.rect.width / 2 - dragElementCenterX,
        prev.rect.top + prev.rect.height / 2 - dragElementCenterY,
      )
      const nextDist = Math.hypot(
        curr.rect.left + curr.rect.width / 2 - dragElementCenterX,
        curr.rect.top + curr.rect.height / 2 - dragElementCenterY,
      )

      return prevDist < nextDist ? prev : curr
    }

    return prev
  }, null)
}
