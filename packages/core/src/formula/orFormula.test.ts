import { describe, expect, it } from 'bun:test'
import { applyFormula, type OrOperation } from './formula'
import { valueFormula } from './formulaUtils'
import { applyEvaluateAllOrFormula, applyOrFormula } from './orFormula'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applyOrFormula', () => {
  it('returns true if any argument is truthy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(0) },
        { formula: valueFormula('yes') },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyOrFormula(formula, ctx)).toBe(true)
  })

  it('returns false if all arguments are falsy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(null) },
        { formula: valueFormula(undefined) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyOrFormula(formula, ctx)).toBe(false)
  })

  it('returns true for first truthy argument', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(true) },
        { formula: valueFormula(false) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyOrFormula(formula, ctx)).toBe(true)
  })
})

describe('applyEvaluateAllOrFormula', () => {
  it('visits all formulas in "report" mode even if the first argument is truthy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(true) },
        { formula: valueFormula('hello') },
        { formula: valueFormula(false) },
      ],
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    // Call applyFormula directly since it will report the results
    expect(applyFormula(formula, ctx, [])).toBe(true)
    expect(results).toMatchObject({
      'arguments/0/formula': true,
      'arguments/1/formula': 'hello',
      'arguments/2/formula': false,
    })
  })

  it('returns true if any argument is truthy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(1) },
        { formula: valueFormula(false) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllOrFormula(formula, ctx)).toBe(true)
  })

  it('returns false if all arguments are falsy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(null) },
        { formula: valueFormula(undefined) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllOrFormula(formula, ctx)).toBe(false)
  })

  it('returns true if last argument is truthy', () => {
    const formula: OrOperation = {
      type: 'or',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(false) },
        { formula: valueFormula('ok') },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllOrFormula(formula, ctx)).toBe(true)
  })
})
