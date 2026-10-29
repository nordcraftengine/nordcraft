import type { Component, ComponentData } from '@nordcraft/core'
import { describe, expect, it } from 'bun:test'
import { createFormulaCache } from './createFormulaCache'

describe('createFormulaCache', () => {
  it('returns empty object when component has no formulas', () => {
    const comp = { name: 'Comp' } as Component
    expect(createFormulaCache(comp)).toEqual({})
  })

  it('does not cache when formula memoize is falsy', () => {
    const comp = {
      name: 'Comp',
      formulas: {
        calc: {
          name: 'calc',
          memoize: false,
          formula: {
            type: 'path',
            path: ['Variables', 'count'],
          },
        },
      },
    } as unknown as Component

    const cache = createFormulaCache(comp)
    const entry = cache.calc
    expect(entry).toBeDefined()

    const data1 = { Variables: { count: 1 } } as unknown as ComponentData
    expect(entry.get(data1)).toEqual({ hit: false })

    entry.set(data1, 42)
    expect(entry.get(data1)).toEqual({ hit: false })
  })

  it('caches and hits when memoized formula inputs remain unchanged', () => {
    const comp = {
      name: 'Comp',
      formulas: {
        double: {
          name: 'double',
          memoize: true,
          formula: {
            type: 'path',
            path: ['Variables', 'count'],
          },
        },
      },
    } as unknown as Component

    const cache = createFormulaCache(comp)
    const entry = cache.double

    const data1 = {
      Variables: { count: 5 },
      Attributes: { title: 'hello' },
    } as unknown as ComponentData

    // Initial cache miss
    expect(entry.get(data1)).toEqual({ hit: false })

    // Set cache
    entry.set(data1, 10)
    expect(entry.get(data1)).toEqual({ hit: true, data: 10 })

    // Unrelated data change should still HIT
    const dataWithDifferentAttrs = {
      Variables: { count: 5 },
      Attributes: { title: 'world' },
    } as unknown as ComponentData
    expect(entry.get(dataWithDifferentAttrs)).toEqual({ hit: true, data: 10 })

    // Related data change should MISS
    const dataWithDifferentCount = {
      Variables: { count: 6 },
      Attributes: { title: 'hello' },
    } as unknown as ComponentData
    expect(entry.get(dataWithDifferentCount)).toEqual({ hit: false })

    // Updating cache with new value
    entry.set(dataWithDifferentCount, 12)
    expect(entry.get(dataWithDifferentCount)).toEqual({ hit: true, data: 12 })
  })

  it('extracts nested paths from function arguments and records', () => {
    const comp = {
      name: 'Comp',
      formulas: {
        combined: {
          name: 'combined',
          memoize: true,
          formula: {
            type: 'function',
            name: 'add',
            arguments: [
              {
                name: 'a',
                formula: { type: 'path', path: ['Variables', 'a'] },
              },
              {
                name: 'b',
                formula: {
                  type: 'record',
                  entries: [
                    {
                      name: 'nested',
                      formula: { type: 'path', path: ['Attributes', 'b'] },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    } as unknown as Component

    const cache = createFormulaCache(comp)
    const entry = cache.combined

    const data1 = {
      Variables: { a: 1 },
      Attributes: { b: 2, c: 99 },
    } as unknown as ComponentData

    expect(entry.get(data1)).toEqual({ hit: false })
    entry.set(data1, 'result-1')
    expect(entry.get(data1)).toEqual({ hit: true, data: 'result-1' })

    // Changing unreferenced property c should still hit
    expect(
      entry.get({
        Variables: { a: 1 },
        Attributes: { b: 2, c: 100 },
      } as unknown as ComponentData),
    ).toEqual({ hit: true, data: 'result-1' })

    // Changing a should miss
    expect(
      entry.get({
        Variables: { a: 2 },
        Attributes: { b: 2, c: 99 },
      } as unknown as ComponentData),
    ).toEqual({ hit: false })

    // Changing b should miss
    expect(
      entry.get({
        Variables: { a: 1 },
        Attributes: { b: 3, c: 99 },
      } as unknown as ComponentData),
    ).toEqual({ hit: false })
  })

  it('ignores Args paths from cache config', () => {
    const comp = {
      name: 'Comp',
      formulas: {
        withArgs: {
          name: 'withArgs',
          memoize: true,
          formula: {
            type: 'path',
            path: ['Args', 'input'],
          },
        },
      },
    } as unknown as Component

    const cache = createFormulaCache(comp)
    const entry = cache.withArgs

    // Since 'Args' paths are not tracked as component data keys, keys is empty, canCache is true
    const data1 = { Variables: {} } as unknown as ComponentData
    expect(entry.get(data1)).toEqual({ hit: false })
    entry.set(data1, 'cached')
    expect(entry.get(data1)).toEqual({ hit: true, data: 'cached' })
  })

  it('handles apply operations to memoized and unmemoized formulas', () => {
    const comp = {
      name: 'Comp',
      formulas: {
        base: {
          name: 'base',
          memoize: true,
          formula: { type: 'path', path: ['Variables', 'x'] },
        },
        caller: {
          name: 'caller',
          memoize: true,
          formula: { type: 'apply', name: 'base' },
        },
        unmemoizedBase: {
          name: 'unmemoizedBase',
          memoize: false,
          formula: { type: 'path', path: ['Variables', 'y'] },
        },
        callerOfUnmemoized: {
          name: 'callerOfUnmemoized',
          memoize: true,
          formula: { type: 'apply', name: 'unmemoizedBase' },
        },
      },
    } as unknown as Component

    const cache = createFormulaCache(comp)

    // caller should inherit base's memoize path
    const data1 = { Variables: { x: 10, y: 20 } } as unknown as ComponentData
    expect(cache.caller.get(data1)).toEqual({ hit: false })
    cache.caller.set(data1, 100)
    expect(cache.caller.get(data1)).toEqual({ hit: true, data: 100 })

    // Changing y should not invalidate caller (only x is used)
    expect(
      cache.caller.get({
        Variables: { x: 10, y: 999 },
      } as unknown as ComponentData),
    ).toEqual({ hit: true, data: 100 })

    // callerOfUnmemoized should not be cacheable because its target formula is not memoized
    expect(cache.callerOfUnmemoized.get(data1)).toEqual({ hit: false })
    cache.callerOfUnmemoized.set(data1, 200)
    expect(cache.callerOfUnmemoized.get(data1)).toEqual({ hit: false })
  })
})
