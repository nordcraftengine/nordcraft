import { describe, expect, it } from 'bun:test'
import type { ObjectOperation } from './formula'
import { valueFormula } from './formulaUtils'
import { applyObjectFormula } from './objectFormula'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applyObjectFormula', () => {
  it('returns an object with evaluated values', () => {
    const formula: ObjectOperation = {
      type: 'object',
      arguments: [
        { name: 'a', formula: valueFormula(1) },
        { name: 'b', formula: valueFormula('hello') },
        { name: 'c', formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyObjectFormula(formula, ctx)).toEqual({
      a: 1,
      b: 'hello',
      c: true,
    })
  })

  it('returns an empty object if arguments is undefined', () => {
    const formula: ObjectOperation = {
      type: 'object',
      arguments: undefined,
    }
    const ctx = createTestFormulaContext()
    expect(applyObjectFormula(formula, ctx)).toEqual({})
  })

  it('evaluates all formulas and reports results in "report" mode', () => {
    const formula: ObjectOperation = {
      type: 'object',
      arguments: [
        { name: 'x', formula: valueFormula('foo') },
        { name: 'y', formula: valueFormula('bar') },
      ],
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    expect(applyObjectFormula(formula, ctx)).toEqual({ x: 'foo', y: 'bar' })
    expect(results).toMatchObject({
      'arguments/0/formula': 'foo',
      'arguments/1/formula': 'bar',
    })
  })
})
