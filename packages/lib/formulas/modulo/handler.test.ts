import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Modulo', () => {
  test('should return the remainder', () => {
    expect(handler([4, 2], undefined as any)).toBe(0)
    expect(handler([3, 2], undefined as any)).toBe(1)
  })
})
