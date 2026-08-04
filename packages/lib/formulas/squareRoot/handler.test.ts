import { describe, expect, test } from 'bun:test'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Square root', () => {
  test('should return the square root', () => {
    expect(handler([4], undefined as any)).toBe(2)
    expect(handler([81], undefined as any)).toBe(9)
  })
})
