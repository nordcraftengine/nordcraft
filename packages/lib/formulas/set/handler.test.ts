import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Set', () => {
  test('throw if key is undefined', () => {
    const collection = { test: '' }
    expect(handler([collection], undefined as any)).toBe(null)
  })

  test('returns updated object as expected', () => {
    expect(handler([{ test: '' }, 'test', 'test'], undefined as any)).toEqual({
      test: 'test',
    })
    expect(
      handler([[{ test: '' }], [0, 'test'], 'test'], undefined as any),
    ).toEqual([
      {
        test: 'test',
      },
    ])
  })
})
