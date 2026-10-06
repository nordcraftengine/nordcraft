import fastDeepEqual from 'fast-deep-equal'

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
  set(value: T, options?: { force?: boolean }) {
    // Short circuit and skip expensive `deepEqual` if there are not currently any subscribers
    if (this.subscribers.size === 0) {
      this.value = value
      return
    }

    if (options?.force || fastDeepEqual(value, this.value) === false) {
      this.value = value
      for (const subscriber of this.subscribers) {
        subscriber.notify(this.value)
      }
    }
  }

  update(f: (current: T) => T, options?: { force?: boolean }) {
    this.set(f(this.value), options)
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
    this.subscriptions.length = 0
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
    const subscriber = {
      notify: (value: T) => signal2.set(f(value)),
      destroy: () => signal2.destroy(),
    }
    this.subscribers.add(subscriber)
    signal2.subscriptions.push(() => {
      this.subscribers.delete(subscriber)
    })
    return signal2
  }
  /**
   * Subscribes to a mapped version of the signal, only notifying when the mapped value changes.
   * This is more efficient than a map and then subscribing to the mapped signal as it skips an
   * intermediate signal and only notifies when the mapped value actually changes.
   */
  subscribeMap<T2>(
    f: (value: T) => T2,
    notify: (value: T2) => void,
    config?: { destroy?: () => void },
  ) {
    let prev = f(this.value)
    notify(prev)
    const subscriber = {
      notify: (value: T) => {
        const next = f(value)
        if (fastDeepEqual(next, prev) === false) {
          prev = next
          notify(next)
        }
      },
      destroy: config?.destroy,
    }
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }
}

export function signal<T>(value: T) {
  return new Signal(value)
}

if (typeof window !== 'undefined') {
  ;(window as any).signal = signal
  ;(window as any).deepEqual = fastDeepEqual
}
