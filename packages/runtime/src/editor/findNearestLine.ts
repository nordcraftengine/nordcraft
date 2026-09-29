import type { Line, Point } from './types'

/**
 * Finds the nearest line to a given point from an array of lines.
 *
 * @param lines - An array of line segments defined by their endpoints.
 * @param point - The point to which the nearest line is to be found.
 * @returns The line segment nearest to the given point.
 */
export function findNearestLine(
  lines: Line[],
  point: Point,
): { nearestLine: Line | null; dist: number; projectionPoint: number } {
  let minDistSquared = Infinity
  let nearestLine: Line | null = null
  let nearestProjectionPoint = 0

  for (const line of lines) {
    const { distSquared, projectionPoint } = distancePointToSegmentSquared(
      point,
      line,
    )
    if (distSquared < minDistSquared) {
      minDistSquared = distSquared
      nearestLine = line
      nearestProjectionPoint = projectionPoint
    }
  }

  return {
    nearestLine,
    dist: Math.sqrt(minDistSquared),
    projectionPoint: nearestProjectionPoint,
  }
}

/**
 * Represents where the perpendicular projection of the point onto the infinite line lies relative to the line segment:
 *  -	If t is 0, the projection is at (x1, y1).
 *  -	If t is 1, the projection is at (x2, y2).
 *  -	If t is between 0 and 1, the projection lies somewhere between the two endpoints.
 *
 * (x1, y1) *---o-----------* (x2, y2)
 *              |          /
 *              |         /
 *              |        /
 *              |       /
 *              |      /
 *  MIN_DIST -> |     /
 *              |    /
 *              |   /
 *              |  /
 *              | /
 *              |/
 *            (x, y)
 *
 * Where "o" The length along the line segment where the projection point lies.
 *
 * Notice that the calculation works for diagonal lines as well as horizontal and vertical lines.
 */
function distancePointToSegmentSquared(point: Point, line: Line) {
  const dx = line.x2 - line.x1
  const dy = line.y2 - line.y1
  const l2 = dx * dx + dy * dy

  // If l2 is zero, the line segment is actually a point. We return the squared distance between the point and this single point.
  if (l2 === 0) {
    return {
      distSquared:
        (point.x - line.x1) * (point.x - line.x1) +
        (point.y - line.y1) * (point.y - line.y1),
      projectionPoint: 0.5,
    }
  }

  let projectionPoint =
    ((point.x - line.x1) * dx + (point.y - line.y1) * dy) / l2

  // Clamp t to [0,1] for the projection point to lie within the finite line segment.
  projectionPoint = Math.max(0, Math.min(1, projectionPoint))

  const projX = line.x1 + projectionPoint * dx
  const projY = line.y1 + projectionPoint * dy

  // No need to take the square root, since we are only comparing distances and square root is monotonic.
  return {
    distSquared:
      (point.x - projX) * (point.x - projX) +
      (point.y - projY) * (point.y - projY),
    projectionPoint,
  }
}
