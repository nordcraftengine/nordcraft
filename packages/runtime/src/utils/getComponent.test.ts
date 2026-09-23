import { describe, expect, it } from 'bun:test'

describe('getComponent', () => {
  const compA = { name: 'A', value: 1 } as any
  const compB = { name: 'B', value: 2 } as any
  const compC = { name: 'C', value: 3 } as any

  it('caches components after first call and ignores new list on subsequent calls with useCache=true', async () => {
    // Import isolated module instance to ensure fresh componentMap in test
    const { getComponent } = await import(
      `./getComponent?t=${Math.random().toString(36).slice(2)}`
    )
    // First call: cache is built from [compA, compB]
    expect(getComponent('A', [compA, compB])).toBe(compA)
    expect(getComponent('B', [compA, compB])).toBe(compB)

    // Second call: provide a different list, but cache should still return from the original cache
    expect(getComponent('C', [compC])).toBeUndefined()
    expect(getComponent('A', [compC])).toBe(compA)
  })

  it('does not use cache when useCache is false', async () => {
    const { getComponent } = await import(
      `./getComponent?t=${Math.random().toString(36).slice(2)}`
    )
    // First call: should find compA in the list
    expect(getComponent('A', [compA, compB], false)).toBe(compA)

    // Second call: provide a different list, should now find compC
    expect(getComponent('C', [compC], false)).toBe(compC)

    // Should not find compA in the new list
    expect(getComponent('A', [compC], false)).toBeUndefined()
  })
})
