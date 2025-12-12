import { describe, expect, it } from 'bun:test'
import { applyAndFormula, applyEvaluateAllAndFormula } from './andFormula'
import { applyFormula, type AndOperation } from './formula'
import { valueFormula } from './formulaUtils'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applyAndFormula', () => {
  it('returns false if any argument is falsy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(true) },
        { formula: valueFormula(false) },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyAndFormula(formula, ctx)).toBe(false)
  })

  it('returns true if all arguments are truthy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(1) },
        { formula: valueFormula('ok') },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyAndFormula(formula, ctx)).toBe(true)
  })

  it('returns false for first falsy argument', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula(true) },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyAndFormula(formula, ctx)).toBe(false)
  })
})

describe('applyEvaluateAllAndFormula', () => {
  it('visits all formulas in "report" mode even if the first argument is falsy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(false) },
        { formula: valueFormula('hello') },
        { formula: valueFormula(true) },
      ],
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    expect(applyFormula(formula, ctx, [])).toBe(false)
    expect(results).toMatchObject({
      'arguments/0': false,
      'arguments/1': 'hello',
      'arguments/2': true,
    })
  })

  it('returns true if all arguments are truthy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(1) },
        { formula: valueFormula('ok') },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllAndFormula(formula, ctx)).toBe(true)
  })

  it('returns false if any argument is falsy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(true) },
        { formula: valueFormula(false) },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllAndFormula(formula, ctx)).toBe(false)
  })

  it('returns false if last argument is falsy', () => {
    const formula: AndOperation = {
      type: 'and',
      arguments: [
        { formula: valueFormula(true) },
        { formula: valueFormula(true) },
        { formula: valueFormula(false) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllAndFormula(formula, ctx)).toBe(false)
  })
})
