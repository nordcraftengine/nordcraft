import type { Component } from '@nordcraft/core'
import { applyFormula, valueFormula } from '@nordcraft/core'
import { describe, expect, it } from 'bun:test'
import { createFormulaCache } from './createFormulaCache'

describe('createFormulaCache', () => {
  it('returns a prototype-free cache so Object.prototype names like toString or constructor do not collide', () => {
    const component: Component = {
      name: 'TestComponent',
      formulas: {
        toString: {
          name: 'toString',
          memoize: false,
          formula: valueFormula('custom-to-string'),
        },
        constructor: {
          name: 'constructor',
          memoize: false,
          formula: valueFormula('custom-constructor'),
        },
        cachedFormula: {
          name: 'cachedFormula',
          memoize: true,
          formula: valueFormula('cached-val'),
        },
      },
      nodes: {},
    }

    const formulaCache = createFormulaCache(component)
    expect(Object.getPrototypeOf(formulaCache)).toBeNull()
    expect(formulaCache.toString).toBeUndefined()
    expect(formulaCache.constructor).toBeUndefined()

    const ctx: any = {
      component,
      formulaCache,
      env: { isServer: false, branchName: 'main', request: undefined },
      toddle: { errors: [] },
    }

    expect(
      applyFormula({ type: 'apply', name: 'toString', arguments: [] }, ctx, {}),
    ).toBe('custom-to-string')
    expect(
      applyFormula(
        { type: 'apply', name: 'constructor', arguments: [] },
        ctx,
        {},
      ),
    ).toBe('custom-constructor')
    expect(
      applyFormula(
        { type: 'apply', name: 'cachedFormula', arguments: [] },
        ctx,
        {},
      ),
    ).toBe('cached-val')
  })

  it('returns a prototype-free empty cache when component has no memoized formulas', () => {
    const component: Component = {
      name: 'NoMemoComponent',
      formulas: {
        toString: {
          name: 'toString',
          memoize: false,
          formula: valueFormula('result'),
        },
      },
      nodes: {},
    }
    const cache = createFormulaCache(component)
    expect(Object.getPrototypeOf(cache)).toBeNull()
    expect(cache.toString).toBeUndefined()
  })
})
