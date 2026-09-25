import { describe, expect, test } from 'bun:test'
import { signal } from './signal'

describe('Signal', () => {
  test('get(), set(), and update() manage signal value', () => {
    const s = signal(10)
    expect(s.get()).toBe(10)

    s.set(20)
    expect(s.get()).toBe(20)

    s.update((v) => v + 5)
    expect(s.get()).toBe(25)
  })

  test('subscribe() notifies subscriber on creation and on change', () => {
    const s = signal('initial')
    const values: string[] = []

    const unsubscribe = s.subscribe((val) => {
      values.push(val)
    })

    expect(values).toEqual(['initial'])

    s.set('second')
    expect(values).toEqual(['initial', 'second'])

    // Fast deep equal prevents notifications on identical values
    s.set('second')
    expect(values).toEqual(['initial', 'second'])

    unsubscribe()
    s.set('third')
    expect(values).toEqual(['initial', 'second'])
    expect(s.subscribers.size).toBe(0)
  })

  test('subscribeTo() subscribes to upstream and cleans up on downstream destroy()', () => {
    const upstream = signal('hello')
    const downstream = signal<string | null>(null)

    expect(upstream.subscribers.size).toBe(0)

    downstream.subscribeTo(upstream, (val) => {
      downstream.set(`echo: ${val}`)
    })

    expect(upstream.subscribers.size).toBe(1)
    expect(downstream.get()).toBe('echo: hello')

    upstream.set('world')
    expect(downstream.get()).toBe('echo: world')

    downstream.destroy()
    expect(upstream.subscribers.size).toBe(0)
  })

  test('subscribeTo() returns an unsubscribe function that can be called early', () => {
    const upstream = signal(1)
    const downstream = signal(0)

    const unsubscribe = downstream.subscribeTo(upstream, (val) => {
      downstream.set(val * 2)
    })

    expect(upstream.subscribers.size).toBe(1)
    expect(downstream.get()).toBe(2)

    unsubscribe()
    expect(upstream.subscribers.size).toBe(0)

    upstream.set(5)
    expect(downstream.get()).toBe(2)

    // Destroying downstream later should be idempotent and not throw
    downstream.destroy()
    expect(upstream.subscribers.size).toBe(0)
  })

  test('subscribeTo() invokes config.destroy when upstream is destroyed', () => {
    const upstream = signal('a')
    const downstream = signal('b')
    let downstreamDestroyed = false

    downstream.subscribeTo(
      upstream,
      (val) => {
        downstream.set(val)
      },
      {
        destroy: () => {
          downstreamDestroyed = true
          downstream.destroy()
        },
      },
    )

    expect(upstream.subscribers.size).toBe(1)
    upstream.destroy()

    expect(downstreamDestroyed).toBe(true)
    expect(upstream.subscribers.size).toBe(0)
  })

  test('map() derives a new signal and cleans up bidirectionally', () => {
    const source = signal(2)
    const mapped = source.map((n) => n * 10)

    expect(mapped.get()).toBe(20)
    expect(source.subscribers.size).toBe(1)

    source.set(5)
    expect(mapped.get()).toBe(50)

    // Destroying mapped signal unhooks from source
    mapped.destroy()
    expect(source.subscribers.size).toBe(0)

    // If source is destroyed, mapped is destroyed too
    const source2 = signal('a')
    const mapped2 = source2.map((s) => s.toUpperCase())
    expect(mapped2.get()).toBe('A')

    source2.destroy()
    expect(source2.subscribers.size).toBe(0)
    expect(mapped2.subscribers.size).toBe(0)
  })

  test('destroy() cleans subscribers and prevents re-entrancy', () => {
    const s = signal(1)
    let destroyCalled = 0

    s.subscribe(() => {}, {
      destroy: () => {
        destroyCalled++
        // Attempt recursive destroy call
        s.destroy()
      },
    })

    expect(s.subscribers.size).toBe(1)
    s.destroy()

    expect(destroyCalled).toBe(1)
    expect(s.subscribers.size).toBe(0)
  })

  test('cleanSubscribers() removes subscribers and calls their destroy hooks', () => {
    const s = signal('active')
    let destroyed = false

    s.subscribe(() => {}, {
      destroy: () => {
        destroyed = true
      },
    })

    expect(s.subscribers.size).toBe(1)
    s.cleanSubscribers()

    expect(destroyed).toBe(true)
    expect(s.subscribers.size).toBe(0)
  })
})
