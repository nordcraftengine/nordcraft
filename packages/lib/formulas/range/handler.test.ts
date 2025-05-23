import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Range', () => {
  test('Should return an array given a start and end', () => {
    expect(handler([1, 4], undefined as any)).toEqual([1, 2, 3, 4])
    expect(handler([10, 12], undefined as any)).toEqual([10, 11, 12])
  })
  test('should return an array with a single item if start and end is the same', () => {
    expect(handler([2, 2], undefined as any)).toEqual([2])
  })
  test('should return an empty array if the end is smaller than the start', () => {
    expect(handler([3, 1], undefined as any)).toEqual([])
  })
})
