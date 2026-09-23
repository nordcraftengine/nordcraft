import { describe, expect, jest, test } from 'bun:test'
import { InMemoryCache } from './cache'

describe('inMemoryCache', () => {
  test('Entries expire as expected', () => {
    jest.useFakeTimers()
    const cache = new InMemoryCache({ ttlSeconds: 1, swrSeconds: 2 })
    cache.set('key', 'value')
    expect(cache.get('key')?.value).toBe('value')
    expect(cache.get('key')?.stale).toBe(false)
    expect(cache.size()).toBe(1)
    jest.advanceTimersByTime(500)
    expect(cache.get('key')?.value).toBe('value')
    expect(cache.get('key')?.stale).toBe(false)
    expect(cache.size()).toBe(1)
    jest.advanceTimersByTime(700) // 1.2 seconds total
    expect(cache.get('key')?.stale).toBe(true)
    expect(cache.get('key')?.value).toBe('value')
    jest.advanceTimersByTime(1000) // 2.2 seconds total
    expect(cache.get('key')).toBeUndefined()
    expect(cache.size()).toBe(0)
  })
  test('Entries are automatically cleaned up after SWR time', () => {
    jest.useFakeTimers()
    const cache = new InMemoryCache({ ttlSeconds: 1, swrSeconds: 2 })
    cache.set('key', 'value')
    expect(cache.size()).toBe(1)
    jest.advanceTimersByTime(2100) // 2.1 seconds total
    expect(cache.size()).toBe(0)
  })
})
