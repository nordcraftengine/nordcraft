import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: DateFromTimestamp', () => {
  test('should convert the input to a Date', () => {
    expect(handler([1687781259115], undefined as any)).toEqual(
      new Date(1687781259115),
    )
  })
  test('should return null if the input is not a number/timestamp', () => {
    expect(handler(['August 18 2023'], undefined as any)).toBe(null)
  })
})
