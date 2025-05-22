import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Sum', () => {
  test('returns the sum of all numbers', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toStrictEqual(6)
  })
  test('throws when first argument is not an array', () => {
    expect(handler(['hello', 3], undefined as any)).toBe(null)
  })
  test('throws if any item in the array is not a number', () => {
    expect(handler([['hello', 3]], undefined as any)).toBe(null)
  })
})
