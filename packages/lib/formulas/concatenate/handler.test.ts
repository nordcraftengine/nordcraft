import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Concatenate', () => {
  test('concats array items to a string', () => {
    expect(handler([4, 2, 6], undefined as any)).toBe('426')
  })
  test('returns an empty array for an empty input', () => {
    expect(handler([], undefined as any)).toStrictEqual([])
  })
  test('returns an empty string for an empty string input', () => {
    expect(handler([''], undefined as any)).toBe('')
  })
  test('concats nested arrays to an array', () => {
    expect(
      handler(
        [
          [4, 2, 6],
          [1, 2, 3],
        ],
        undefined as any,
      ),
    ).toStrictEqual([4, 2, 6, 1, 2, 3])
  })
  test('concats/merges objects', () => {
    expect(
      handler([{ test: 1 }, { test1: 2 }], undefined as any),
    ).toStrictEqual({ test: 1, test1: 2 })
    expect(
      handler([{ test: 1 }, { test1: 2 }, { test: 3 }], undefined as any),
    ).toStrictEqual({ test: 3, test1: 2 })
  })
})
