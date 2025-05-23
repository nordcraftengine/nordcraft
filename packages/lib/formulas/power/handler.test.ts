import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Power', () => {
  test('should return the power of the first number raised to the second number', () => {
    expect(handler([2, 3], undefined as any)).toBe(8)
    expect(handler([2, -2], undefined as any)).toBe(0.25)
    expect(handler([-10, -2], undefined as any)).toBe(0.01)
  })
})
