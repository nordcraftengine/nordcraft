import { describe, expect, it, mock } from 'bun:test'
import { signal } from './signal'

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

  it('subscribeMap() only notifies when mapped value changes', () => {
    const s = signal({ a: 1, b: 10 })
    const received: number[] = []
    const unsubscribe = s.subscribeMap(
      (val) => val.a,
      (a) => received.push(a),
    )

    expect(received).toEqual([1])

    s.set({ a: 1, b: 20 })
    expect(received).toEqual([1])

    s.set({ a: 2, b: 20 })
    expect(received).toEqual([1, 2])

    unsubscribe()
    s.set({ a: 3, b: 20 })
    expect(received).toEqual([1, 2])
  })

  it('reads current value during reentrant subscriber notifications', () => {
    const s = signal(1)
    const firstReceived: number[] = []
    const secondReceived: number[] = []

    s.subscribe((val) => {
      firstReceived.push(val)
      if (val === 2) {
        s.set(3)
      }
    })
    s.subscribe((val) => {
      secondReceived.push(val)
    })

    s.set(2)
    expect(firstReceived).toEqual([1, 2, 3])
    expect(secondReceived).toEqual([1, 3, 3])
    expect(s.get()).toBe(3)
  })

  it('subscribeMap() notifies when initial callback synchronously updates the source signal', () => {
    const s = signal(1)
    const received: number[] = []

    s.subscribeMap(
      (val) => val * 10,
      (mapped) => {
        received.push(mapped)
        if (mapped === 10) {
          s.set(2)
        }
      },
    )

    expect(received).toEqual([10, 20])
  })

  it('fork() forwards updates and cleans up on destroy', () => {
    const parent = signal({ count: 1 })
    const child = parent.fork()
    const received: number[] = []
    child.subscribeMap(
      (val) => val.count,
      (c) => received.push(c),
    )

    expect(received).toEqual([1])
    parent.set({ count: 2 })
    expect(received).toEqual([1, 2])

    child.destroy()
    expect(parent.subscribers.size).toBe(0)
    parent.set({ count: 3 })
    expect(received).toEqual([1, 2])
  })
})
