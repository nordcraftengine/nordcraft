import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Filter', () => {
  test('throws if a function is not passed', () => {
    expect(handler([[1, 2, 3]], undefined as any)).toBe(null)
  })
  test('filters an array when a function is passed', () => {
    const expectedResult = [2, 3]
    const result = handler(
      [
        [1, 2, 3, 4, 5],
        ({ item }: { item: number }) => {
          return item > 1 && item < 4
        },
      ],
      undefined as any,
    )
    expect(result).toEqual(expectedResult)
  })
  test('filters an object when a function is passed', () => {
    const expectedResult = { b: 20, c: 30 }
    const result = handler(
      [{ a: 10, b: 20, c: 30 }, ({ value }: { value: number }) => value > 11],
      undefined as any,
    )
    expect(result).toEqual(expectedResult)
    const expectedResult2 = { b: 20 }
    const result2 = handler(
      [
        { a: 10, b: 20, c: 30 },
        ({ key, value }: { key: string; value: number }) =>
          value > 11 && key !== 'c',
      ],
      undefined as any,
    )
    expect(result2).toEqual(expectedResult2)
  })
  test('throws if it is not an array or object', () => {
    expect(handler(['example', () => false], undefined as any)).toBe(null)
  })
})
