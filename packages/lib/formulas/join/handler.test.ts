import { describe, expect, test } from 'bun:test'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Join', () => {
  test('should return null if collection is not an array', () => {
    expect(handler([1, '1'], undefined as any)).toBe(null)
  })
  test('should return a joined string', () => {
    expect(handler([['Hello', 'world'], ' '], undefined as any)).toBe(
      'Hello world',
    )
    expect(handler([['H', 'i', '!'], ''], undefined as any)).toBe('Hi!')
  })
})
