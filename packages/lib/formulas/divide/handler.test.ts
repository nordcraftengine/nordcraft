import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Divide', () => {
  test('should return null if either a or b is not a number', () => {
    expect(handler(['abc', 2], undefined as any)).toBe(null)
    expect(handler([2, 'def'], undefined as any)).toBe(null)
  })

  test('handler should return correct division result of a and b if they are both numbers', () => {
    expect(handler([3, 2], undefined as any)).toBe(1.5)
    expect(handler([100, 5], undefined as any)).toBe(20)
  })
})
