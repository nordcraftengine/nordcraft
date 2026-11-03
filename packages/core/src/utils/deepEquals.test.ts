import { describe, expect, test } from 'bun:test'
import { deepEquals } from './deepEquals'

describe('deepEquals', () => {
  test('compares primitives', () => {
    expect(deepEquals(1, 1)).toBe(true)
    expect(deepEquals('a', 'a')).toBe(true)
    expect(deepEquals(true, true)).toBe(true)
    expect(deepEquals(null, null)).toBe(true)
    expect(deepEquals(undefined, undefined)).toBe(true)
    expect(deepEquals(1, 2)).toBe(false)
    expect(deepEquals('1', 1)).toBe(false)
    expect(deepEquals(null, undefined)).toBe(false)
    expect(deepEquals(false, 0)).toBe(false)
  })

  test('treats NaN as equal and zero as equal regardless of sign', () => {
    expect(deepEquals(NaN, NaN)).toBe(true)
    expect(deepEquals(0, -0)).toBe(true)
    expect(deepEquals(NaN, 1)).toBe(false)
  })

  test('compares functions by reference', () => {
    const fn = () => {}
    expect(deepEquals(fn, fn)).toBe(true)
    expect(deepEquals(fn, () => {})).toBe(false)
  })

  test('compares plain objects recursively', () => {
    expect(deepEquals({}, {})).toBe(true)
    expect(deepEquals({ a: 1, b: [2, 3] }, { b: [2, 3], a: 1 })).toBe(true)
    expect(
      deepEquals({ a: { b: { c: 'value' } } }, { a: { b: { c: 'value' } } }),
    ).toBe(true)
    expect(deepEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false)
    expect(deepEquals({ a: undefined }, { b: undefined })).toBe(false)
  })

  test('only compares own enumerable properties', () => {
    const inherited = Object.create({ inherited: true })
    inherited.value = 1
    expect(deepEquals(inherited, { value: 1 })).toBe(true)
    expect(deepEquals(inherited, { value: 1, inherited: true })).toBe(false)
  })

  test('compares arrays including nested values', () => {
    expect(deepEquals([], [])).toBe(true)
    expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEquals([{ a: 1 }], [{ a: 1 }])).toBe(true)
    expect(deepEquals([1, 2], [2, 1])).toBe(false)
    expect(deepEquals([1], [1, 2])).toBe(false)
    expect(deepEquals([1, 2], { 0: 1, 1: 2 })).toBe(false)
  })

  test('compares boxed primitive values', () => {
    expect(deepEquals(Object(1), Object(1))).toBe(true)
    expect(deepEquals(Object(1), Object(2))).toBe(false)
    expect(deepEquals(Object('a'), Object('a'))).toBe(true)
    expect(deepEquals(Object('a'), Object('b'))).toBe(false)
    expect(deepEquals(Object(true), Object(true))).toBe(true)
    expect(deepEquals(Object(true), Object(false))).toBe(false)
    expect(deepEquals(Object(1n), Object(1n))).toBe(true)
    expect(deepEquals(Object(1n), Object(2n))).toBe(false)
    expect(deepEquals(Object(Symbol.for('a')), Object(Symbol.for('a')))).toBe(
      true,
    )
  })

  test('compares dates and regular expressions', () => {
    expect(deepEquals(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(
      true,
    )
    expect(deepEquals(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(
      false,
    )
    expect(deepEquals(new Date('invalid'), new Date('invalid'))).toBe(false)
    expect(deepEquals(/abc/gi, /abc/gi)).toBe(true)
    expect(deepEquals(/abc/g, /abc/i)).toBe(false)
    expect(deepEquals(/abc/, /abd/)).toBe(false)
  })

  test('compares maps by value regardless of insertion order', () => {
    expect(
      deepEquals(
        new Map<unknown, unknown>([
          ['a', 1],
          [{ nested: true }, [2]],
        ]),
        new Map<unknown, unknown>([
          [{ nested: true }, [2]],
          ['a', 1],
        ]),
      ),
    ).toBe(true)
    expect(deepEquals(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false)
    expect(deepEquals(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false)
    expect(
      deepEquals(
        new Map([['a', 1]]),
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toBe(false)
  })

  test('compares sets by value regardless of insertion order', () => {
    expect(
      deepEquals(
        new Set<unknown>([1, { nested: true }]),
        new Set<unknown>([{ nested: true }, 1]),
      ),
    ).toBe(true)
    expect(deepEquals(new Set([1, 2]), new Set([1, 3]))).toBe(false)
    expect(deepEquals(new Set([1]), new Set([1, 2]))).toBe(false)
  })

  test('compares typed arrays', () => {
    expect(
      deepEquals(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])),
    ).toBe(true)
    expect(
      deepEquals(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4])),
    ).toBe(false)
    expect(deepEquals(new Uint8Array([1, 2]), new Uint16Array([1, 2]))).toBe(
      false,
    )
    expect(deepEquals(new Float32Array([NaN]), new Float32Array([NaN]))).toBe(
      true,
    )
  })

  test('compares urls', () => {
    expect(
      deepEquals(
        new URL('https://example.com/path?a=1#hash'),
        new URL('https://example.com/path?a=1#hash'),
      ),
    ).toBe(true)
    expect(
      deepEquals(
        new URL('https://example.com/path?a=1'),
        new URL('https://example.com/path?a=2'),
      ),
    ).toBe(false)
  })

  test('compares errors', () => {
    expect(deepEquals(new Error('a'), new Error('a'))).toBe(true)
    expect(deepEquals(new Error('a'), new Error('b'))).toBe(false)
    expect(deepEquals(new TypeError('a'), new TypeError('a'))).toBe(true)
    expect(deepEquals(new TypeError('a'), new Error('a'))).toBe(false)
  })

  test('handles objects with a null prototype', () => {
    const a = Object.create(null)
    a.value = [1, 2]
    const b = Object.create(null)
    b.value = [1, 2]
    expect(deepEquals(a, b)).toBe(true)
    expect(deepEquals(a, { value: [1, 2] })).toBe(false)
  })
})
