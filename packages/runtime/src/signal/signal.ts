import fastDeepEqual from 'fast-deep-equal'

// Shared identity mapper to avoid allocating a closure per identity map
export const identity = <T>(value: T): T => value

export class Signal<T> {
  value: T
  subscribers: Set<{
    notify: (value: T) => void
    destroy?: () => void
  }>
  private _subscriptions?: Array<() => void>
  private destroyHooks?: Array<() => void>
  destroying = false

  get subscriptions(): Array<() => void> {
    return (this._subscriptions ??= [])
  }
  set subscriptions(value: Array<() => void> | undefined) {
    this._subscriptions = value
  }

  constructor(value: T) {
    this.value = value
    this.subscribers = new Set()
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
  onDestroy(fn: () => void) {
    ;(this.destroyHooks ??= []).push(fn)
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
    if (this.destroyHooks) {
      for (const hook of this.destroyHooks) {
        hook()
      }
      this.destroyHooks.length = 0
    }
    if (this._subscriptions) {
      for (const subscription of this._subscriptions) {
        subscription()
      }
      this._subscriptions.length = 0
    }
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
}

export function signal<T>(value: T) {
  return new Signal(value)
}

if (typeof window !== 'undefined') {
  ;(window as any).signal = signal
  ;(window as any).deepEqual = fastDeepEqual
}
