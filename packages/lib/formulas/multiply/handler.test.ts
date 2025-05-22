import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Multiply', () => {
  test('should return the product of all the numbers', () => {
    expect(handler([4, 2, 3], undefined as any)).toBe(24)
    expect(handler([3, 2], undefined as any)).toBe(6)
  })
})
