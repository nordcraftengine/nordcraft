import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: ADD', () => {
  test('sum should work for numbers', () => {
    expect(handler([-5, 2, 7], undefined as any)).toBe(4)
  })
  test('sum should return null if given non-numbers', () => {
    expect(handler([4, null, -2], undefined as any)).toBe(null)
  })
  test('sum should return 0 for no input', () => {
    expect(handler([], undefined as any)).toBe(0)
  })
  test('sum should return null for invalid input', () => {
    expect(handler([null, 'test'], undefined as any)).toBe(null)
  })
})
