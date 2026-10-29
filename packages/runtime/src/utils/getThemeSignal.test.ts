import { describe, expect, it } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'

describe('getThemeSignal', () => {
  it('registers a single cookieStore change listener across multiple calls', async () => {
    let listenerCount = 0
    let changeHandler: ((event: any) => void) | null = null

    const mockCookieStore = {
      addEventListener: (type: string, handler: any) => {
        if (type === 'change') {
          listenerCount++
          changeHandler = handler
        }
      },
    }

    Object.defineProperty(window, 'cookieStore', {
      value: mockCookieStore,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis, 'cookieStore', {
      value: mockCookieStore,
      configurable: true,
      writable: true,
    })
    document.cookie = ''

    const { getThemeSignal } = await import(
      `./getThemeSignal?t=${Math.random().toString(36).slice(2)}`
    )

    const dummyComponent = { name: 'Comp', nodes: {} } as any
    const dataSignal1 = signal({} as any)
    const dataSignal2 = signal({} as any)
    const env = { runtime: 'browser' } as any

    const themeSignal1 = getThemeSignal(dummyComponent, dataSignal1, env)
    const themeSignal2 = getThemeSignal(dummyComponent, dataSignal2, env)

    // Exactly one listener should be attached despite two getThemeSignal calls
    expect(listenerCount).toBe(1)
    expect(changeHandler).toBeFunction()

    // Second theme signal should be active and receive cookieStore changes
    expect(themeSignal2.get()).toBeNull()
    changeHandler!({
      changed: [{ name: 'nc-theme', value: 'dark' }],
      deleted: [],
    })
    expect(themeSignal2.get()).toBe('dark')

    // Deletion should clear the active theme
    changeHandler!({
      changed: [],
      deleted: [{ name: 'nc-theme' }],
    })
    expect(themeSignal2.get()).toBeNull()

    // Destroying the signal cleans up activeCookieThemeSignal
    themeSignal2.destroy()
    // Subsequent change event does not throw
    expect(() => {
      changeHandler!({
        changed: [{ name: 'nc-theme', value: 'light' }],
        deleted: [],
      })
    }).not.toThrow()

    // Cleanup themeSignal1
    themeSignal1.destroy()
  })
})
