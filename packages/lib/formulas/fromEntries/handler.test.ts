import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: From entries', () => {
  test('Should return a an object when given a list of key/values', () => {
    expect(
      handler([[{ key: 'name', value: 'Andreas' }]], undefined as any),
    ).toEqual({ name: 'Andreas' })
    expect(
      handler(
        [
          [
            { key: 'one', value: 1 },
            { key: 'two', value: 2 },
          ],
        ],
        undefined as any,
      ),
    ).toEqual({ one: 1, two: 2 })
  })

  test('should use the latest value for a key', () => {
    expect(
      handler(
        [
          [
            { key: 'name', value: 'Andreas' },
            { key: 'name', value: 'Bobo' },
          ],
        ],
        undefined as any,
      ),
    ).toEqual({ name: 'Bobo' })
  })

  test('should return an empty object if the list is empty', () => {
    expect(handler([[]], undefined as any)).toEqual({})
  })

  test('should return null if the list is not an array', () => {
    expect(handler([{}], undefined as any)).toBe(null)
  })
})
