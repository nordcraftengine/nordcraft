import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Parse URL', () => {
  test('Should return the parsed url object', () => {
    expect(
      handler(
        ['https://test.com:8080/path1/path2?q1=test&q2=test2#hash'],
        undefined as any,
      ),
    ).toEqual({
      hostname: 'test.com',
      searchParams: { q1: 'test', q2: 'test2' },
      path: ['path1', 'path2'],
      hash: 'hash',
      href: 'https://test.com:8080/path1/path2?q1=test&q2=test2#hash',
      protocol: 'https:',
      port: '8080',
      origin: 'https://test.com:8080',
    })
  })
  test('Should return null if the parameter is not a string', () => {
    expect(handler([1], undefined as any)).toBe(null)
  })
  test('Should return null if the parameter is not a valid url', () => {
    expect(handler(['im not a url'], undefined as any)).toBe(null)
  })
  test('Should return the parsed relative url object with base', () => {
    expect(
      handler(
        ['/path1/path2?q1=test&q2=test2#hash', 'https://test.com:8080'],
        undefined as any,
      ),
    ).toEqual({
      hostname: 'test.com',
      searchParams: { q1: 'test', q2: 'test2' },
      path: ['path1', 'path2'],
      hash: 'hash',
      href: 'https://test.com:8080/path1/path2?q1=test&q2=test2#hash',
      protocol: 'https:',
      port: '8080',
      origin: 'https://test.com:8080',
    })
  })
  test('Should print the href when calling toString on the returned object', () => {
    const result = handler(
      ['https://test.com:8080/path1/path2?q1=test&q2=test2#hash'],
      undefined as any,
    )
    expect(result?.toString()).toBe(
      'https://test.com:8080/path1/path2?q1=test&q2=test2#hash',
    )
  })
  test("Should print the same string as when using the native URL's toString", () => {
    const url = 'https://test.com:8080/path1/path2?q1=test&q2=test2#hash'
    const result = handler([url], undefined as any)
    const nativeUrl = new URL(url)
    expect(result?.toString()).toBe(nativeUrl.toString())
  })
})
