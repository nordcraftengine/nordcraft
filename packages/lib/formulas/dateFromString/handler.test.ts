import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Date From String', () => {
  test('should convert the input to a Date', () => {
    expect(handler(['December 17, 1995 03:24:00'], undefined as any)).toEqual(
      new Date('December 17, 1995 03:24:00'),
    )
  })
  test('should return null if the input is not a string', () => {
    expect(handler([new Date()], undefined as any)).toBe(null)
  })
  test('should convert a utz date string correctly', () => {
    const date = handler(['2023-10-27T06:00:18.522344+00:00'], undefined as any)
    expect(date).toBeInstanceOf(Date)
    expect(date?.getDate()).toEqual(27)
  })
})
