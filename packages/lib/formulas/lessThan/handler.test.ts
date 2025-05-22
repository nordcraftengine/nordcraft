import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Less than', () => {
  test('Should return true if the first value is less than the second', () => {
    expect(handler([1, 2], undefined as any)).toBe(true)
    expect(handler(['aa', 'and'], undefined as any)).toBe(true)
  })
  test('Should return false if the first value is equal to the second', () => {
    expect(handler([2, 2], undefined as any)).toBe(false)
    expect(handler(['andreas', 'andreas'], undefined as any)).toBe(false)
  })
  test('Should return false if the first value is greater than the second', () => {
    expect(handler([2, 1], undefined as any)).toBe(false)
    expect(handler(['bobo', 'andreas'], undefined as any)).toBe(false)
  })
})
