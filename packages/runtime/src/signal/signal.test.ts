import { describe, expect, it } from 'bun:test'
import { identity, signal } from './signal'

describe('signal', () => {
  it('notifies subscribers on change and unsubscribes on the returned teardown', () => {
    const sig = signal(1)
    const seen: number[] = []
    const unsubscribe = sig.subscribe((value) => seen.push(value))
    expect(seen).toEqual([1])

    sig.set(2)
    sig.set(2) // no-op: deep equal
    expect(seen).toEqual([1, 2])

    unsubscribe()
    sig.set(3)
    expect(seen).toEqual([1, 2])
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
