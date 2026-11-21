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
    // Use var to avoid V8 TDZ hole checks on this closed-over hot-path variable;
    // initialized before the returned unsubscribe closure is created.
    // eslint-disable-next-line no-var
    var subscriber = { notify, destroy: config?.destroy }
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
    // Use var to avoid V8 TDZ hole checks on closed-over hot-path variables;
    // both are initialized before any subscriber/cleanup closure is created.
    // eslint-disable-next-line no-var
    var signal2 = signal(f(this.value))
    // eslint-disable-next-line no-var
    var subscriber = {
      notify: (value: T) => signal2.set(f(value)),
      destroy: () => signal2.destroy(),
    }
    this.subscribers.add(subscriber)
    signal2.subscriptions.push(() => {
      this.subscribers.delete(subscriber)
    })
    return signal2
  }
}

export function signal<T>(value: T) {
  return new Signal(value)
}

if (typeof window !== 'undefined') {
  ;(window as any).signal = signal
  ;(window as any).deepEqual = fastDeepEqual
}
