import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: FLOOR', () => {
  test('should return null if the input to floor is not a number', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe(null)
  })
  test('should return null if the decimals is not a number', () => {
    expect(handler([10.7], undefined as any)).toBe(null)
  })

  test('should floor a number correctly', () => {
    expect(handler([10.7, 1], undefined as any)).toBe(10.7)
    expect(handler([10.753, 2], undefined as any)).toBe(10.75)
  })
})
