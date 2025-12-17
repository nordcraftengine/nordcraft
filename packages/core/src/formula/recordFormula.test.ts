import { describe, expect, it } from 'bun:test'
import type { RecordOperation } from './formula'
import { valueFormula } from './formulaUtils'
import { applyRecordFormula } from './recordFormula'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applyRecordFormula', () => {
  it('returns an object with evaluated entries', () => {
    const formula: RecordOperation = {
      type: 'record',
      entries: [
        { name: 'a', formula: valueFormula(1) },
        { name: 'b', formula: valueFormula('hello') },
        { name: 'c', formula: valueFormula(true) },
      ],
    }
    const ctx = createTestFormulaContext()
    expect(applyRecordFormula(formula, ctx)).toEqual({
      a: 1,
      b: 'hello',
      c: true,
    })
  })

  it('returns an empty object if entries is empty', () => {
    const formula: RecordOperation = {
      type: 'record',
      entries: [],
    }
    const ctx = createTestFormulaContext()
    expect(applyRecordFormula(formula, ctx)).toEqual({})
  })

  it('evaluates all formulas and reports results in "report" mode', () => {
    const formula: RecordOperation = {
      type: 'record',
      entries: [
        { name: 'x', formula: valueFormula('foo') },
        { name: 'y', formula: valueFormula('bar') },
      ],
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    expect(applyRecordFormula(formula, ctx)).toEqual({ x: 'foo', y: 'bar' })
    expect(results).toMatchObject({
      'entries/0/formula': 'foo',
      'entries/1/formula': 'bar',
    })
  })
})
