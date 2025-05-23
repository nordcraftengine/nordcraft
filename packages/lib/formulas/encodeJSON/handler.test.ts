import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Encode JSON', () => {
  test('Should encode objects', () => {
    expect(handler([{ hello: 'world' }, 0], undefined as any)).toEqual(
      `{"hello":"world"}`,
    )
  })
  test('Should encode arrays', () => {
    expect(handler([[1, 2, 3], 0], undefined as any)).toEqual(`[1,2,3]`)
  })
  test('Should encode strings', () => {
    expect(handler(['hello', 0], undefined as any)).toEqual(`"hello"`)
  })
  test('Should respect indentation', () => {
    expect(
      handler([{ one: 1, two: 2, three: 3 }, 4], undefined as any),
    ).toEqual(
      `{
    "one": 1,
    "two": 2,
    "three": 3
}`,
    )
  })
})
