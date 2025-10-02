import { omit, omitPaths, sortObjectEntries } from './collections'

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
