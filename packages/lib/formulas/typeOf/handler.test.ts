import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Type of', () => {
  test('returns type name for different data types', () => {
    expect(handler(['some string'], undefined as any)).toBe('String')
    expect(handler([12], undefined as any)).toBe('Number')
    expect(handler([false], undefined as any)).toBe('Boolean')
    expect(handler([], undefined as any)).toBe('Null')
    expect(handler([null], undefined as any)).toBe('Null')
    expect(handler([[1, 2, 3]], undefined as any)).toBe('Array')
    expect(handler([{ name: 'Andreas' }], undefined as any)).toBe('Object')
  })
})
