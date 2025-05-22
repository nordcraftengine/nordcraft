import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Current Date', () => {
  test('should return a date representing current date/time', () => {
    const now = new Date()
    const formulaNow = handler([], undefined as any)
    expect(formulaNow).toBeInstanceOf(Date)
    expect(
      Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(now),
    ).toEqual(
      Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
        formulaNow as Date,
      ),
    )
  })
})
