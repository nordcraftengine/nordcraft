import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Flatten', () => {
  test('should return a flattened array if given an array', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toEqual([1, 2, 3])
    expect(handler([[['a', 'b', 'c'], 2, 3]], undefined as any)).toEqual([
      'a',
      'b',
      'c',
      2,
      3,
    ])
  })

  test('should return null if not given an array', () => {
    expect(handler([123], undefined as any)).toBe(null)
  })
})
