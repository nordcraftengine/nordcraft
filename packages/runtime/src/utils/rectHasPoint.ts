import type { Point } from '../editor/types'

export function rectHasPoint(rect: DOMRect, { x, y }: Point, tolerance = 0) {
  return (
    x >= rect.left - tolerance &&
    x <= rect.right + tolerance &&
    y >= rect.top - tolerance &&
    y <= rect.bottom + tolerance
  )
}
