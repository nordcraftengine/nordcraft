import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Entries', () => {
  test('handler should return null when object is not an object', () => {
    expect(handler([], undefined as any)).toBe(null)
  })

  test('handler returns key-value pairs as expected', () => {
    expect(
      handler([{ key1: 'val1', key2: [1, 2, 3] }], undefined as any),
    ).toEqual([
      { key: 'key1', value: 'val1' },
      { key: 'key2', value: [1, 2, 3] },
    ])
  })
})
