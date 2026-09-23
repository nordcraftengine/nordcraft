import { describe, expect, it } from 'bun:test'
import { applyArrayFormula } from './arrayFormula'
import type { ArrayOperation } from './formula'
import { valueFormula } from './formulaUtils'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applyArrayFormula', () => {
  it('returns an array with evaluated values', () => {
    const formula: ArrayOperation = {
      type: 'array',
      arguments: [
        { formula: valueFormula(1) },
        { formula: valueFormula('hello') },
        { formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyArrayFormula(formula, ctx)).toEqual([1, 'hello', true])
  })

  it('returns an empty array if arguments is empty', () => {
    const formula: ArrayOperation = {
      type: 'array',
      arguments: [],
    }
    const ctx = createTestFormulaContext()
    expect(applyArrayFormula(formula, ctx)).toEqual([])
  })

  it('evaluates all formulas and reports results in "report" mode', () => {
    const formula: ArrayOperation = {
      type: 'array',
      arguments: [
        { formula: valueFormula('foo') },
        { formula: valueFormula('bar') },
      ],
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    expect(applyArrayFormula(formula, ctx)).toEqual(['foo', 'bar'])
    expect(results).toMatchObject({
      'arguments/0/formula': 'foo',
      'arguments/1/formula': 'bar',
    })
  })
})
