import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: TRIM', () => {
  test('returns a trimmed string if input is a string', () => {
    expect(handler(['   some string    '], undefined as any)).toBe(
      'some string',
    )
  })

  test("returns the string itself if there's nothing to trim", () => {
    const s = 'some string'
    expect(handler([s], undefined as any)).toBe(s)
  })

  test('should return nulls if input is not a string', () => {
    const input = { some: 'object' }
    expect(handler([input], undefined as any)).toBe(null)
    expect(handler([undefined], undefined as any)).toBe(null)
  })
})
