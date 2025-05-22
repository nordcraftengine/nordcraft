import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: APPEND', () => {
  test('appends a value to an array', () => {
    expect(handler([[1, 2], 3], undefined as any)).toStrictEqual([1, 2, 3])
  })
  test('throws when first argument is not an array', () => {
    expect(handler(['hello', 3], undefined as any)).toBe(null)
  })
  test("appends second argument regardless of whether it's an array or raw value", () => {
    expect(handler([[1, 2], 'hello'], undefined as any)).toStrictEqual([
      1,
      2,
      'hello',
    ])
  })
})
