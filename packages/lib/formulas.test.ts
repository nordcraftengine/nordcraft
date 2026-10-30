import {
  NON_STATIC_LIB_FORMULAS,
  PURE_LIB_FORMULAS,
} from '@nordcraft/core/dist/formula/contextlessEvaluateFormula'
import { describe, expect, test } from 'bun:test'
import * as libFormulas from './formulas'

describe('formula static purity classification in @nordcraft/core', () => {
  test('PURE_LIB_FORMULAS stays in sync with @nordcraft/std-lib', () => {
    const stdLibKeys = Object.keys(libFormulas)
    const expectedPure = stdLibKeys
      .filter((name) => !NON_STATIC_LIB_FORMULAS.has(name))
      .sort()

    expect(Array.from(PURE_LIB_FORMULAS).sort()).toEqual(expectedPure)
  })

  test('NON_STATIC_LIB_FORMULAS only contains valid formulas from @nordcraft/std-lib', () => {
    const stdLibKeys = new Set(Object.keys(libFormulas))
    for (const formula of NON_STATIC_LIB_FORMULAS) {
      expect(stdLibKeys.has(formula)).toBe(true)
    }
  })

  test('all formulas in @nordcraft/std-lib are classified as either pure or non-static in @nordcraft/core', () => {
    const stdLibKeys = Object.keys(libFormulas)
    for (const key of stdLibKeys) {
      const isClassified =
        PURE_LIB_FORMULAS.has(key) || NON_STATIC_LIB_FORMULAS.has(key)
      expect(isClassified).toBe(true)
    }
  })
})
