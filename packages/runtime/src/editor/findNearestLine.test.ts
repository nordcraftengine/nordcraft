import { describe, expect, test } from 'bun:test'
import type { Line, Point } from '../editor/types'
import { findNearestLine } from './findNearestLine'

describe('findNearestLine', () => {
  const parent: Element = document.createElement('div')
  test('should find the nearest line to a point', () => {
    const lines: Line[] = [
      { x1: 0, y1: 0, x2: 0, y2: 1, slotName: null, parent, index: 0 },
      { x1: 1, y1: 0, x2: 1, y2: 1, slotName: null, parent, index: 0 },
      { x1: 2, y1: 0, x2: 2, y2: 1, slotName: null, parent, index: 0 },
    ]
    const point: Point = { x: 1.5, y: 0.5 }
    const nearestLine = findNearestLine(lines, point)?.nearestLines[0]
    expect(nearestLine).toEqual({
      x1: 1,
      y1: 0,
      x2: 1,
      y2: 1,
      slotName: null,
      parent,
      index: 0,
    })
  })

  test('should handle point exactly on a line', () => {
    const lines: Line[] = [
      { x1: 0, y1: 0, x2: 2, y2: 0, slotName: null, parent, index: 0 },
      { x1: 1, y1: -1, x2: 1, y2: 1, slotName: null, parent, index: 0 },
    ]
    const point: Point = { x: 1, y: 0.5 }
    const nearestLine = findNearestLine(lines, point)?.nearestLines[0]
    expect(nearestLine).toEqual({
      x1: 1,
      y1: -1,
      x2: 1,
      y2: 1,
      slotName: null,
      parent,
      index: 0,
    })
  })

  test('should handle empty lines array', () => {
    const lines: Line[] = []
    const point: Point = { x: 0, y: 0 }
    expect(findNearestLine(lines, point).nearestLines).toBeEmpty()
  })

  test('should handle lines with zero length (points)', () => {
    const lines: Line[] = [
      { x1: 1, y1: 1, x2: 1, y2: 1, slotName: null, parent, index: 0 },
      { x1: 2, y1: 2, x2: 3, y2: 3, slotName: null, parent, index: 0 },
    ]
    const point: Point = { x: 1, y: 1.5 }
    const nearestLine = findNearestLine(lines, point)?.nearestLines[0]
    expect(nearestLine).toEqual({
      x1: 1,
      y1: 1,
      x2: 1,
      y2: 1,
      slotName: null,
      parent,
      index: 0,
    })
  })

  test('should handle negative coordinates', () => {
    const lines: Line[] = [
      { x1: -2, y1: -2, x2: -2, y2: 2, slotName: null, parent, index: 0 },
      { x1: -2, y1: 2, x2: 2, y2: 2, slotName: null, parent, index: 0 },
      { x1: 2, y1: 2, x2: 2, y2: -2, slotName: null, parent, index: 0 },
      { x1: 2, y1: -2, x2: -2, y2: -2, slotName: null, parent, index: 0 },
    ]
    const point: Point = { x: 0, y: 0 }
    const nearestLine = findNearestLine(lines, point)?.nearestLines[0]
    // The point is inside the square; function should return one of the sides
    expect(nearestLine).toEqual({
      x1: -2,
      y1: -2,
      x2: -2,
      y2: 2,
      slotName: null,
      parent,
      index: 0,
    })
  })

  test('should handle when multiple lines are equally close', () => {
    const lines: Line[] = [
      { x1: 0, y1: 1, x2: 1, y2: 1, slotName: null, parent, index: 0 },
      { x1: 0, y1: -1, x2: 1, y2: -1, slotName: null, parent, index: 0 },
    ]
    const point: Point = { x: 0.5, y: 0 }
    const nearestLine = findNearestLine(lines, point)?.nearestLines[0]
    // Both lines are at distance 1; the function should return the first one
    expect(nearestLine).toEqual({
      x1: 0,
      y1: 1,
      x2: 1,
      y2: 1,
      slotName: null,
      parent,
      index: 0,
    })
  })
})
