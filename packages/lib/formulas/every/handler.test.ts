import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Every', () => {
  test('handler returns null when callback is not a function', () => {
    expect(handler([[], 'not a func'], undefined as any)).toBe(null)
  })

  test('handler calls callback as expected', () => {
    expect(
      handler(
        [
          [1, 2, 3],
          ({ item }: { item: any; index: number }) => typeof item === 'number',
        ],
        undefined as any,
      ),
    ).toBeTruthy()
    expect(
      handler(
        [
          [1, 'a string', 3],
          ({ item }: { item: any; index: number }) => typeof item === 'number',
        ],
        undefined as any,
      ),
    ).toBeFalsy()
    expect(
      handler(
        [[1, 2, 3], ({ index }: { item: any; index: number }) => index > -1],
        undefined as any,
      ),
    ).toBeTruthy()
  })
})
