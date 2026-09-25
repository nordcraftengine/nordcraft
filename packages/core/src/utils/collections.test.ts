import {
  deepSortObject,
  filterObject,
  get,
  groupBy,
  mapValues,
  omit,
  omitPaths,
  set,
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

describe('mapValues()', () => {
  test('it maps values of an object', () => {
    expect(mapValues({ a: 1, b: 2 }, (v: number) => v * 2)).toEqual({
      a: 2,
      b: 4,
    })
  })
})

describe('groupBy()', () => {
  test('it groups items by key', () => {
    const items = [
      { id: 1, type: 'a' },
      { id: 2, type: 'b' },
      { id: 3, type: 'a' },
    ]
    expect(groupBy(items, (i: any) => i.type)).toEqual({
      a: [
        { id: 1, type: 'a' },
        { id: 3, type: 'a' },
      ],
      b: [{ id: 2, type: 'b' }],
    })
  })
})

describe('filterObject()', () => {
  test('it filters object entries', () => {
    expect(
      filterObject({ a: 1, b: 2, c: 3 }, ([_, v]: [any, number]) => v > 1),
    ).toEqual({
      b: 2,
      c: 3,
    })
  })
})

describe('get()', () => {
  test('it gets a nested value', () => {
    expect(get({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
  })
  test('it returns undefined if path not found', () => {
    expect(get({ a: { b: 1 } }, ['a', 'c'])).toBeUndefined()
  })
})

describe('set()', () => {
  test('it sets a nested value', () => {
    expect(set({ a: { b: 1 } }, ['a', 'c'], 2)).toEqual({ a: { b: 1, c: 2 } })
  })
  test('it creates objects if needed', () => {
    expect(set({}, ['a', 'b'], 1)).toEqual({ a: { b: 1 } })
  })
})

describe('deepSortObject()', () => {
  test('it sorts keys recursively', () => {
    const obj = { b: 1, a: { d: 2, c: 3 } }
    const sorted = deepSortObject(obj)
    expect(Object.keys(sorted as any)).toEqual(['a', 'b'])
    expect(Object.keys((sorted as any).a)).toEqual(['c', 'd'])
  })
})
