import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Prepend', () => {
  test('prepends a value to an array', () => {
    expect(handler([[2, 3], 1], undefined as any)).toStrictEqual([1, 2, 3])
  })
  test('throws when first argument is not an array', () => {
    expect(handler(['hello', 3], undefined as any)).toBe(null)
  })
  test('function is pure', () => {
    const arr = [1, 2, 3]
    const res = handler([arr, 0], undefined as any)
    expect(res).toStrictEqual([0, 1, 2, 3])
    expect(arr).toStrictEqual([1, 2, 3])
  })
  test("prepends second argument regardless of whether it's an array or raw value", () => {
    expect(handler([[1, 2], 'hello'], undefined as any)).toStrictEqual([
      'hello',
      1,
      2,
    ])
  })
})
