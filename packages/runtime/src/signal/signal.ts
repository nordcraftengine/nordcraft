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
  set(value: T) {
    // Short circuit and skip expensive `deepEqual` if there are not currently any subscribers
    if (this.subscribers.size === 0) {
      this.value = value
      return
    }

    if (fastDeepEqual(value, this.value) === false) {
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
    for (const subscription of this.subscriptions) {
      subscription()
    }
    this.subscriptions.splice(0, this.subscriptions.length)
    for (const subscriber of this.subscribers) {
      subscriber.destroy?.()
    }
    this.subscribers.clear()
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
  ;(window as any).deepEqual = fastDeepEqual
}
