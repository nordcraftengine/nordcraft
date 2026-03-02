import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Parse JSON', () => {
  test('Should return the parsed value', () => {
    expect(handler(['["hello", "world"]'], undefined as any)).toEqual([
      'hello',
      'world',
    ])
    expect(handler(['{"name":"Andreas"}'], undefined as any)).toEqual({
      name: 'Andreas',
    })
    expect(
      handler(['{"date":"2023-06-28T13:27:53.264Z"}'], undefined as any),
    ).toEqual({
      date: new Date('2023-06-28T13:27:53.264Z'),
    })
    expect(handler(['"Andreas"'], undefined as any)).toEqual('Andreas')
    expect(handler(['null'], undefined as any)).toEqual(null)
  })
  test('Should return null on invalid JSON', () => {
    expect(handler(['["hello", "world"'], undefined as any)).toBe(null)
  })
  test('Should return dates as string if parseDate is false', () => {
    expect(
      handler(['{"date":"2023-06-28T13:27:53.264Z"}', false], undefined as any),
    ).toEqual({
      date: '2023-06-28T13:27:53.264Z',
    })
  })
  test('Should return dates as Date if parseDate is true', () => {
    expect(
      handler(['{"date":"2023-06-28T13:27:53.264Z"}', true], undefined as any),
    ).toEqual({
      date: new Date('2023-06-28T13:27:53.264Z'),
    })
  })
  test('Should return dates as Date if parseDate is null or undefined', () => {
    expect(
      handler(['{"date":"2023-06-28T13:27:53.264Z"}', null], undefined as any),
    ).toEqual({
      date: new Date('2023-06-28T13:27:53.264Z'),
    })
    expect(
      handler(['{"date":"2023-06-28T13:27:53.264Z"}'], undefined as any),
    ).toEqual({
      date: new Date('2023-06-28T13:27:53.264Z'),
    })
  })
})
