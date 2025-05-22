import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: MINUS', () => {
  test('should subtract correctly', () => {
    expect(handler([2, 7], undefined as any)).toBe(-5)
    expect(handler([12, 3], undefined as any)).toBe(9)
  })
  test('should return nullfor non-number inputs', () => {
    expect(handler(['test', 'hello'], undefined as any)).toBe(null)
    expect(handler(['test', 1], undefined as any)).toBe(null)
    expect(handler([2, 'tes'], undefined as any)).toBe(null)
  })
})
