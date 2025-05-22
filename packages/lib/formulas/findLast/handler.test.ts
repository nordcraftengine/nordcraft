import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Find', () => {
  test('throws if fx is not a function', () => {
    expect(handler([[1, 2, 3], 'notAFunc'], undefined as any)).toBe(null)
  })

  test('throws if items is neither an array or object', () => {
    expect(handler(['my items', () => true], undefined as any)).toBe(null)
  })

  test('finds an item in an array when fx is a function', () => {
    expect(
      handler(
        [[1, 2, 3, 2], ({ item }: { item: number }) => item < 3],
        undefined as any,
      ),
    ).toEqual(2)
    expect(handler([[1, 2, 3], () => true], undefined as any)).toBe(3)
  })

  test('finds a value in an object when fx is a function', () => {
    expect(
      handler(
        [
          { one: 1, two: 2, three: 3 },
          ({ key }: { key: string }) => key.startsWith('t'),
        ],
        undefined as any,
      ),
    ).toBe(3)
    expect(
      handler(
        [
          { one: 1, two: 2, three: 3 },
          ({ value }: { value: number }) => value === 3,
        ],
        undefined as any,
      ),
    ).toBe(3)
  })

  test('returns undefined if nothing is found', () => {
    expect(
      handler(
        [
          { one: 1, two: 2, three: 3 },
          ({ key }: { key: string }) => key === 'four',
        ],
        undefined as any,
      ),
    ).toBe(undefined)
  })
})
