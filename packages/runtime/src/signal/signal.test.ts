import { describe, expect, it, mock } from 'bun:test'
import { identity, signal } from './signal'

describe('Signal', () => {
  it('returns the initial value with get()', () => {
    const s = signal(42)
    expect(s.get()).toBe(42)
  })

  it('notifies subscribers immediately on subscribe and when value changes', () => {
    const s = signal('initial')
    const values: string[] = []
    const unsubscribe = s.subscribe((val) => values.push(val))

    expect(values).toEqual(['initial'])

    s.set('updated')
    expect(values).toEqual(['initial', 'updated'])

    unsubscribe()
    s.set('after-unsubscribe')
    expect(values).toEqual(['initial', 'updated'])
  })

  it('does not notify subscribers when set with deeply equal value unless forced', () => {
    const s = signal({ a: 1, b: [2, 3] })
    const notify = mock(() => {})
    s.subscribe(notify)

    expect(notify).toHaveBeenCalledTimes(1)

    s.set({ a: 1, b: [2, 3] })
    expect(notify).toHaveBeenCalledTimes(1)

    s.set({ a: 1, b: [2, 3] }, { force: true })
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('updates value without notifying when there are no subscribers', () => {
    const s = signal({ count: 0 })
    s.set({ count: 1 })
    expect(s.get()).toEqual({ count: 1 })
  })

  it('updates value using update()', () => {
    const s = signal(10)
    s.update((curr) => curr + 5)
    expect(s.get()).toBe(15)
  })

  it('maps values to a derived signal and only evaluates mapper once on creation', () => {
    const s = signal(2)
    const mapper = mock((x: number) => x * 10)
    const mapped = s.map(mapper)

    expect(mapper).toHaveBeenCalledTimes(1)
    expect(mapped.get()).toBe(20)

    const received: number[] = []
    mapped.subscribe((val) => received.push(val))
    expect(received).toEqual([20])

    s.set(3)
    expect(mapper).toHaveBeenCalledTimes(2)
    expect(mapped.get()).toBe(30)
    expect(received).toEqual([20, 30])
  })

  it('cleans up parent subscription when mapped signal is destroyed', () => {
    const parent = signal(1)
    const mapper = mock((x: number) => x + 1)
    const child = parent.map(mapper)

    expect(parent.subscribers.size).toBe(1)
    child.destroy()
    expect(parent.subscribers.size).toBe(0)

    parent.set(2)
    expect(mapper).toHaveBeenCalledTimes(1)
  })

  it('destroys mapped child signals when parent signal is destroyed', () => {
    const parent = signal(1)
    const child = parent.map((x) => x * 2)
    const onChildDestroy = mock(() => {})
    child.subscribe(() => {}, { destroy: onChildDestroy })

    parent.destroy()
    expect(onChildDestroy).toHaveBeenCalledTimes(1)
    expect(child.subscribers.size).toBe(0)
  })

  it('calls subscriber destroy callbacks on cleanSubscribers()', () => {
    const s = signal('a')
    const onDestroy = mock(() => {})
    s.subscribe(() => {}, { destroy: onDestroy })

    s.cleanSubscribers()
    expect(onDestroy).toHaveBeenCalledTimes(1)
    expect(s.subscribers.size).toBe(0)
  })

  it('runs onDestroy hooks once when destroyed', () => {
    const sig = signal(1)
    const destroyed: string[] = []
    sig.onDestroy(() => destroyed.push('a'))
    sig.onDestroy(() => destroyed.push('b'))

    sig.destroy()
    sig.destroy() // re-entrancy guard: only once
    expect(destroyed).toEqual(['a', 'b'])
  })

  it('does not run onDestroy hooks when only subscribers are cleaned', () => {
    const sig = signal(1)
    const destroyed = { ran: false }
    const subscriberDestroy = { ran: false }
    sig.subscribe(() => {}, { destroy: () => (subscriberDestroy.ran = true) })
    sig.onDestroy(() => (destroyed.ran = true))

    sig.cleanSubscribers()
    expect(subscriberDestroy.ran).toBe(true)
    expect(destroyed.ran).toBe(false)
  })

  it('preserves subscriber destroy callbacks in destroy()', () => {
    const sig = signal(1)
    const order: string[] = []
    sig.subscribe(() => {}, { destroy: () => order.push('subscriber') })
    sig.onDestroy(() => order.push('hook'))

    sig.destroy()
    expect(order).toEqual(['subscriber', 'hook'])
  })

  it('map chains propagate updates and destroy their parent subscription', () => {
    const sig = signal(1)
    const doubled = sig.map((v) => v * 2)
    expect(doubled.get()).toBe(2)

    sig.set(3)
    expect(doubled.get()).toBe(6)

    doubled.destroy()
    // After destroying the derived signal, parent updates no longer propagate
    sig.set(4)
    expect(doubled.get()).toBe(6)
  })

  it('identity returns its argument', () => {
    const obj = { a: 1 }
    expect(identity(obj)).toBe(obj)
    expect(identity(42)).toBe(42)
  })
})
