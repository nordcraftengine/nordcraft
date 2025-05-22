import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: GET', () => {
  test('should return collection if path is empty', () => {
    expect(handler([[1, 2, 3], []], undefined as any)).toEqual([1, 2, 3])
  })

  test('should use path correctly', () => {
    expect(
      handler(
        [
          [{ test: 'correct' }, 1, 2],
          [0, 'test'],
        ],
        undefined as any,
      ),
    ).toEqual('correct')
    expect(
      handler(
        [{ a: { b: { c: 'correct' } } }, ['a', 'b', 'c']],
        undefined as any,
      ),
    ).toEqual('correct')
    expect(
      handler(
        [{ a: { b: { c: 'correct' } } }, ['a', 0, 'c']],
        undefined as any,
      ),
    ).toBeUndefined()
  })
})
