import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Round up', () => {
  // Test that handler returns null with invalid input
  test('handler returns null for invalid input', () => {
    expect(handler(['a', 1], undefined as any)).toBe(null)
  })
  test('handler returns null if "number of decimals" is invalid', () => {
    expect(handler([1, 'b'], undefined as any)).toBe(null)
  })
  // Test that handler returns expected result with valid input
  test('handler returns expected result with valid input', () => {
    expect(handler([1.111, 1], undefined as any)).toBe(1.2)
    expect(handler([1.567, 2], undefined as any)).toBe(1.57)
    expect(handler([1.001, 0], undefined as any)).toBe(2)
  })
})
