import { createCustomEqual } from 'fast-equals'

/**
 * The APIv2 seems to save Header and FormData prototypes to the dataSignal, which is not supported by the default deepEqual implementation.
 * The better solution would be to save these class instances as plain objects before they go into the signal.
 * A refactor to APIv2 will allow us to use the default deepEqual implementation for everything.
 */
export const customIsEqual = createCustomEqual({
  circular: false,
  createCustomConfig: () => {
    const customAreObjectsEqual = (a: unknown, b: unknown) => {
      // If prototype of header, then compare via reference equality
      if (a instanceof Headers && b instanceof Headers) {
        return (
          JSON.stringify([...a.entries()]) === JSON.stringify([...b.entries()])
        )
      }

      if (a instanceof FormData && b instanceof FormData) {
        return (
          JSON.stringify([...a.entries()]) === JSON.stringify([...b.entries()])
        )
      }

      console.warn(
        'Unsupported custom type comparison, falling back to reference equality',
        {
          a,
          b,
        },
      )
      return a === b
    }

    return {
      getUnsupportedCustomComparator: () => customAreObjectsEqual,
    }
  },
})

export class Signal<T> {
  value: T
  subscribers: Set<{
    notify: (value: T) => void
    destroy?: () => void
  }>
  subscriptions: Array<() => void>
  destroying = false

  constructor(value: T) {
    this.value = value
    this.subscribers = new Set()
    this.subscriptions = []
  }
  get() {
    return this.value
  }
  set(value: T) {
    // Short circuit and skip expensive `deepEqual` if there are not currently any subscribers
    if (this.subscribers.size === 0) {
      this.value = value
      return
    }

    if (customIsEqual(value, this.value) === false) {
      this.value = value
      for (const subscriber of this.subscribers) {
        subscriber.notify(this.value)
      }
    }
  }

  update(f: (current: T) => T) {
    this.set(f(this.value))
  }
  subscribe(notify: (value: T) => void, config?: { destroy?: () => void }) {
    const subscriber = { notify, destroy: config?.destroy }
    this.subscribers.add(subscriber)
    notify(this.value)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }
  destroy() {
    // Prevent re-entrancy
    if (this.destroying) {
      return
    }

    this.destroying = true
    for (const subscriber of this.subscribers) {
      subscriber.destroy?.()
    }
    this.subscribers.clear()
    for (const subscription of this.subscriptions) {
      subscription()
    }
    this.subscriptions.splice(0, this.subscriptions.length)
    this.destroying = false
  }
  cleanSubscribers() {
    for (const subscriber of this.subscribers) {
      subscriber.destroy?.()
    }
    this.subscribers.clear()
  }
  map<T2>(f: (value: T) => T2): Signal<T2> {
    const signal2 = signal(f(this.value))
    signal2.subscriptions.push(
      this.subscribe((value) => signal2.set(f(value)), {
        destroy: () => signal2.destroy(),
      }),
    )
    return signal2
  }
}

export function signal<T>(value: T) {
  return new Signal(value)
}

if (typeof window !== 'undefined') {
  ;(window as any).signal = signal
  ;(window as any).deepEqual = customIsEqual
}
