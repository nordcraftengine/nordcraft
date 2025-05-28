import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Find index', () => {
  test('throws if the fx argument is not a function', () => {
    expect(handler(['items', 'fx'], undefined as any)).toBe(null)
  })
  test('returns the index of the item if an array', () => {
    expect(
      handler(
        [
          ['foo', 'bar'],
          ({ item }: { item: string; index: number }) => item === 'bar',
        ],
        undefined as any,
      ),
    ).toBe(1)
    expect(
      handler(
        [
          ['foo', 'bar'],
          ({ index }: { item: string; index: number }) => index === 0,
        ],
        undefined as any,
      ),
    ).toBe(0)
  })
  test('returns the index of the entry if items is an object', () => {
    expect(
      handler(
        [
          { foo: 'bar', test: 'hi' },
          ({ key }: { key: string; value: string }) => key === 'test',
        ],
        undefined as any,
      ),
    ).toBe(1)
    expect(
      handler(
        [
          { foo: 'bar', test: 'hi' },
          ({ value }: { key: string; value: string }) => value === 'bar',
        ],
        undefined as any,
      ),
    ).toBe(0)
  })
})
