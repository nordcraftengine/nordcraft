import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Timestamp', () => {
  test('returns the timestamp from a Date', () => {
    const now = new Date()
    expect(handler([now], undefined as any)).toEqual(now.getTime())
  })
  test('should return null if the input is not a Date', () => {
    expect(handler([22], undefined as any)).toBe(null)
  })
})
