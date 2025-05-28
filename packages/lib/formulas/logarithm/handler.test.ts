import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Logarithm', () => {
  test('should return the logarithm of the number', () => {
    expect(handler([null], undefined as any)).toBe(null)
    expect(handler([], undefined as any)).toBe(null)
    expect(handler(['hello'], undefined as any)).toBe(null)
    expect(handler([-1], undefined as any)).toBe(null)
    expect(handler([0], undefined as any)).toBe(-Infinity)
    expect(handler([1], undefined as any)).toBe(0)
    expect(handler([10], undefined as any)).toBe(2.302585092994046)
  })
})
