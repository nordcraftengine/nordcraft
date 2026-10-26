import { describe, expect, test } from 'bun:test'
import { hash } from './hash'

describe('hash', () => {
  test('identical strings should lead to the same hash', () => {
    const data1 = "{ foo: 'bar', time: now }"
    const data2 = "{ foo: 'bar', time: now }"
    const firstHash = hash(data1)
    const secondHash = hash(data2)
    expect(firstHash).toEqual(secondHash)
  })
  test('identical strings with same seed should lead to the same hash', () => {
    const data1 = "{ foo: 'bar', time: now }"
    const data2 = "{ foo: 'bar', time: now }"
    const firstHash = hash(data1, 10)
    const secondHash = hash(data2, 10)
    expect(firstHash).toEqual(secondHash)
  })
  test('identical strings with different seed should lead different hashes', () => {
    const data1 = "{ foo: 'bar', time: now }"
    const data2 = "{ foo: 'bar', time: now }"
    const firstHash = hash(data1, 10)
    const secondHash = hash(data2, 5)
    expect(firstHash).not.toEqual(secondHash)
  })
  test('different strings results in different hash values', () => {
    const data1 = "{ foo: 'bar', time: now }"
    const firstHash = hash(data1)
    const data2 = "{ foo: 'bar', time: new Date(now.getTime() + 1000) }"
    const secondHash = hash(data2)
    expect(firstHash).not.toEqual(secondHash)
  })
})
