import { describe, expect, test } from 'bun:test'
import crypto from 'crypto'
import { deepSortObject } from './collections'
import { sha1, stableStringify } from './sha1'
;(global as any).crypto = crypto

describe('sha1', () => {
  test('calculating sha1 of an object works', async () => {
    const data = { foo: 'bar' }
    const sha = await sha1(data)
    expect(sha).toHaveLength(40)
  })
  test('identical objects should lead to the same sha', async () => {
    const now = new Date()
    const data1 = { foo: 'bar', time: now }
    const data2 = { foo: 'bar', time: now }
    const firstSha = await sha1(data1)
    const secondSha = await sha1(data2)
    expect(firstSha).toEqual(secondSha)
  })
  test('variations of an object results in different sha values', async () => {
    const now = new Date()
    const data1 = { foo: 'bar', time: now }
    const firstSha = await sha1(data1)
    const data2 = { foo: 'bar', time: new Date(now.getTime() + 1000) }
    const secondSha = await sha1(data2)
    expect(firstSha).not.toEqual(secondSha)
  })
  test('stableStringify', () => {
    const now = new Date()
    expect(stableStringify({ time: now, foo: 'bar' })).toEqual(
      `{"foo":"bar","time":"${now.toJSON()}"}`,
    )
  })
  test('sortObject sorts object keys as expected', () => {
    expect(
      deepSortObject({
        c: 'test',
        b: [3, 2, { b: 0, a: 1 }],
        d: undefined,
        a: { 2: 'val', 1: 'foo' },
      }),
    ).toEqual({
      a: { 1: 'foo', 2: 'val' },
      b: [3, 2, { a: 1, b: 0 }],
      c: 'test',
      d: undefined,
    })
  })
})
