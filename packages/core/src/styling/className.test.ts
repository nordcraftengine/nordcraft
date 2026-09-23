import { describe, expect, test } from 'bun:test'
import { getClassName, getPathClassName, toValidClassName } from './className'

describe('toValidClassName()', () => {
  test('it trims leading and trailing whitespace and replace the remaining whitespace with hyphens', () => {
    expect(toValidClassName('  my class  ')).toBe('my-class')
  })

  test('it escapes invalid characters by prefixing them with a backslash, if flag is set', () => {
    expect(toValidClassName('my.class', true)).toBe('my\\.class')
  })

  test('it does not escape invalid characters by default', () => {
    expect(toValidClassName('my.class')).toBe('my.class')
  })

  test('it ensures the class name does not start with a number or special character', () => {
    expect(toValidClassName('1class')).toBe('_1class')
  })
})

describe('getClassName()', () => {
  test('it produces the same classname whether a nullish entry is provided or not', () => {
    expect(getClassName([null, undefined, { color: 'red' }] as any)).toBe(
      getClassName([{ color: 'red' }] as any),
    )
  })

  test('it produces the same classname whether an empty object is provided or not', () => {
    expect(getClassName([{}, { color: 'red' }] as any)).toBe(
      getClassName([{ color: 'red' }] as any),
    )
  })
})

describe('getPathClassName()', () => {
  test('it returns a stable classname for the same path', () => {
    const first = getPathClassName('0')
    expect(first.length).toBeGreaterThan(0)
    expect(getPathClassName('0')).toBe(first)
    expect(getPathClassName('0')).toBe(getPathClassName('0'))
  })

  test('it returns different classnames for different paths', () => {
    expect(getPathClassName('0.1')).not.toBe(getPathClassName('0.2'))
  })
})
