import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Size', () => {
  // Test that handler returns null with invalid input
  test('Should return the size of an array', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe(3)
    expect(handler([[]], undefined as any)).toBe(0)
  })
  test('Should return the size of a string', () => {
    expect(handler(['hello'], undefined as any)).toBe(5)
    expect(handler([''], undefined as any)).toBe(0)
  })
  test('Should return the size of an object', () => {
    expect(
      handler([{ name: 'Andreas', role: 'Admin' }], undefined as any),
    ).toBe(2)
    expect(handler([{}], undefined as any)).toBe(0)
  })
})
