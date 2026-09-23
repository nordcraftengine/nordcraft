/**
 * Simple in-memory cache that caches values of type V with
 * a max TTL of ttlSeconds seconds.
 * This is useful for caching values that might be requested
 * multiple times within a short period of time
 */
export class InMemoryCache<V> {
  private cache: Map<string, { timestamp: number; value: V }>
  private ttl: number
  private swr: number
  constructor({
    swrSeconds,
    ttlSeconds,
  }: {
    swrSeconds: number
    ttlSeconds: number
  }) {
    this.cache = new Map()
    if (ttlSeconds > swrSeconds) {
      throw new Error('SWR must be larger or equal to TTL')
    }
    this.ttl = ttlSeconds * 1000
    this.swr = swrSeconds * 1000
  }
  set(key: string, value: V) {
    this.cache.set(key, { timestamp: Date.now(), value })
    setTimeout(() => {
      const entry = this.cache.get(key)
      if (!entry) {
        return
      }
      const now = Date.now()
      const diff = now - entry.timestamp
      if (diff >= this.swr) {
        this.cache.delete(key)
      }
    }, this.swr + 10)
  }
  get(key: string) {
    const cached = this.cache.get(key)
    if (cached) {
      const { value, timestamp } = cached
      const now = Date.now()
      const diff = now - timestamp
      if (diff < this.ttl) {
        return { value, stale: false }
      } else if (diff < this.swr) {
        return { value, stale: true }
      } else {
        // Cleanup expired entry
        this.cache.delete(key)
      }
    }
  }
  delete(key: string) {
    this.cache.delete(key)
  }
  size() {
    return this.cache.size
  }
}
