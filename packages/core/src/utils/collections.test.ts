import { describe, expect, mock, test } from 'bun:test'
import {
  filterObject,
  mapObject,
  mapValues,
  omit,
  omitPaths,
  sortObjectEntries,
} from './collections'

describe('omit()', () => {
  test('it should omit paths from an array and resize the array to the new size', () => {
    expect(omit(['a', 'b', 'c'], [0])).toEqual(['b', 'c'])
  })
  test('it should omit deep paths from a matrix and resize the lowest path', () => {
    expect(
      omit(
        [
          ['a', 'b'],
          ['c', 'd'],
          ['e', 'f', 'g'],
        ],
        [2, 1],
      ),
    ).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'g'],
    ])
  })
})

describe('sortObjectEntries()', () => {
  test('it sorts entries in an object based on the callback function', () => {
    expect(
      sortObjectEntries(
        { c: 'hello', a: 'value', b: 'otherValue' },
        ([key]) => key,
      ),
    ).toEqual([
      ['a', 'value'],
      ['b', 'otherValue'],
      ['c', 'hello'],
    ])
    expect(
      sortObjectEntries(
        { c: 'hello', a: 'value', b: 'otherValue' },
        ([_, value]) => value,
      ),
    ).toEqual([
      ['c', 'hello'],
      ['b', 'otherValue'],
      ['a', 'value'],
    ])
  })
})

describe('omitPaths()', () => {
  test('it filters out paths from an object', () => {
    expect(
      omitPaths(
        {
          a: 'value',
          b: {
            c: 'hello',
            d: 'world',
          },
          e: {
            f: {
              g: 'foo',
            },
            h: 'bar',
          },
        },
        [['a'], ['b', 'c'], ['e', 'f', 'g']],
      ),
    ).toEqual({
      b: {
        d: 'world',
      },
      e: {
        f: {},
        h: 'bar',
      },
    })
  })
})
describe('filterObject()', () => {
  test('it filters the object keys and values based on the predicate', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = filterObject(obj, ([key, value]) => value % 2 === 0)
    expect(result).toEqual({ b: 2, d: 4 })
  })

  test('it handles empty objects', () => {
    expect(filterObject({}, () => true)).toEqual({})
  })

  test('it passes the correct key-value pair to the predicate', () => {
    const obj = { a: 'foo' }
    const spy = mock(() => true)
    filterObject(obj, spy)
    expect(spy).toHaveBeenCalledWith(['a', 'foo'])
  })
})

describe('mapValues()', () => {
  test('it maps values correctly', () => {
    const obj = { a: 1, b: 2 }
    const result = mapValues(obj, (v) => v * 2)
    expect(result).toEqual({ a: 2, b: 4 })
  })

  test('it handles empty objects', () => {
    expect(mapValues({}, (v) => v)).toEqual({})
  })
})

describe('mapObject()', () => {
  test('it maps object keys and values correctly', () => {
    const obj = { a: 1, b: 2 }
    const result = mapObject(obj, ([k, v]) => [`new_${k}`, v * 2])
    expect(result).toEqual({ new_a: 2, new_b: 4 })
  })

  test('it handles empty objects', () => {
    expect(mapObject({}, (kv) => kv)).toEqual({})
  })
})
