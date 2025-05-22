import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Clamp', () => {
  test('returns the value if its within the boundaries', () => {
    expect(handler([4, 2, 6], undefined as any)).toBe(4)
  })
  test('returns the lower boundary if the value is lower than the lower boundary', () => {
    expect(handler([0, 2, 6], undefined as any)).toBe(2)
  })
  test('returns the upper boundary if the value is larger than the upper boundary', () => {
    expect(handler([12, 2, 6], undefined as any)).toBe(6)
  })
  test('throws if an argument is not a number', () => {
    expect(handler(['', 2, 6], undefined as any)).toBe(null)
    expect(handler([4, '', 6], undefined as any)).toBe(null)
    expect(handler([4, 2, ''], undefined as any)).toBe(null)
    expect(handler(['', '', ''], undefined as any)).toBe(null)
  })
})
