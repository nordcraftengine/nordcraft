import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Delete', () => {
  test('should return null if the collection is not an object or an array', () => {
    expect(handler([null, 'foo'], undefined as any)).toBe(null)
    expect(handler(['test', 'foo'], undefined as any)).toBe(null)
  })

  test('should return null if key is not a string, number or array', () => {
    const input = { foo: 'bar' }
    expect(handler([input, {}], undefined as any)).toBe(null)
    expect(handler([input, true], undefined as any)).toBe(null)
  })

  test('should return the original collection invalid keys are provided', () => {
    const input = { foo: 'bar' }
    expect(handler([input, ['hello']], undefined as any)).toEqual(input)
    expect(handler([input, [2]], undefined as any)).toEqual(input)
  })

  test('should delete the item if it is in an array', () => {
    expect(handler([[1, 2, 3], 1], undefined as any)).toEqual([1, 3])
  })

  test('should delete the item if it is in an object', () => {
    expect(handler([{ foo: 'bar' }, 'foo'], undefined as any)).toEqual({})
  })

  test('should handle nested deletes', () => {
    expect(
      handler(
        [
          [
            [1, 2, 3],
            [4, 5, 6],
          ],
          // delete item at index 1 in the array with index 1
          [1, 1],
        ],
        undefined as any,
      ),
    ).toEqual([
      [1, 2, 3],
      [4, 6],
    ])
  })
})
