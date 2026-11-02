import { describe, expect, it } from 'bun:test'
import { getComponent } from './getComponent'

describe('getComponent', () => {
  const compA = { name: 'A', value: 1 } as any
  const compB = { name: 'B', value: 2 } as any
  const compC = { name: 'C', value: 3 } as any

  it('caches components per components array reference when useCache=true', () => {
    const list1 = [compA, compB]
    const list2 = [compC]

    // First call on list1 builds and caches map for list1
    expect(getComponent('A', list1)).toBe(compA)
    expect(getComponent('B', list1)).toBe(compB)

    // Mutating list1 in-place after caching still uses the cached map for list1
    list1.push(compC)
    expect(getComponent('C', list1)).toBeUndefined()

    // A separate components array (e.g. a second custom element instance) gets its own cache
    expect(getComponent('C', list2)).toBe(compC)
    expect(getComponent('A', list2)).toBeUndefined()
  })

  it('does not use cache when useCache is false', () => {
    const list = [compA, compB]
    expect(getComponent('A', list, false)).toBe(compA)

    // Mutating list in-place is reflected when useCache is false
    list.push(compC)
    expect(getComponent('C', list, false)).toBe(compC)
    expect(getComponent('A', [compC], false)).toBeUndefined()
  })
})
