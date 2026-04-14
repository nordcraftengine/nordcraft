import { describe, expect, it } from 'bun:test'
import { applyFormula, type SwitchOperation } from './formula'
import { valueFormula } from './formulaUtils'
import {
  applyEvaluateAllSwitchFormula,
  applySwitchFormula,
} from './switchFormula'
import {
  createTestFormulaContext,
  createTestFormulaContextForAllPaths,
} from './testUtils.test'

describe('applySwitchFormula', () => {
  it('returns the first matching case value', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        { condition: valueFormula(false), formula: valueFormula('no') },
        { condition: valueFormula(true), formula: valueFormula('yes') },
        {
          condition: valueFormula(true),
          formula: valueFormula('should not match'),
        },
      ],
      default: valueFormula('default'),
    }
    const ctx = createTestFormulaContext()
    expect(applySwitchFormula(formula, ctx)).toBe('yes')
  })

  it('returns the default value if no case matches', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        { condition: valueFormula(false), formula: valueFormula('no') },
        { condition: valueFormula(false), formula: valueFormula('nope') },
      ],
      default: valueFormula('default'),
    }
    const ctx = createTestFormulaContext()
    expect(applySwitchFormula(formula, ctx)).toBe('default')
  })

  it('evaluates conditions using context data', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        {
          condition: { type: 'path', path: ['foo'] },
          formula: valueFormula('foo matched'),
        },
        { condition: valueFormula(true), formula: valueFormula('fallback') },
      ],
      default: valueFormula('default'),
    }
    const ctx = createTestFormulaContext({ foo: true })
    expect(applySwitchFormula(formula, ctx)).toBe('foo matched')
  })
})

describe('applyEvaluateAllSwitchFormula', () => {
  it('returns the first matching case value, but evaluates all cases and default', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        { condition: valueFormula(false), formula: valueFormula('no') },
        { condition: valueFormula(true), formula: valueFormula('yes') },
        {
          condition: valueFormula(true),
          formula: valueFormula('should not match'),
        },
      ],
      default: valueFormula('default'),
    }
    const results: Record<string, any> = {}
    const ctx = createTestFormulaContextForAllPaths(
      {},
      (path, result) => (results[path.join('/')] = result),
    )
    // We use applyFormula directly since it will gather results in EVALUATE ALL PATHS mode
    const result = applyFormula(formula, ctx, [])
    expect(result).toBe('yes')
    expect(results).toMatchObject({
      'cases/0/condition': false,
      'cases/0/formula': 'no',
      'cases/1/condition': true,
      'cases/1/formula': 'yes',
      'cases/2/condition': true,
      'cases/2/formula': 'should not match',
      default: 'default',
    })
  })

  it('returns the default value if no case matches', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        { condition: valueFormula(false), formula: valueFormula('no') },
        { condition: valueFormula(false), formula: valueFormula('nope') },
      ],
      default: valueFormula('default'),
    }
    const ctx = createTestFormulaContext()
    expect(applyEvaluateAllSwitchFormula(formula, ctx)).toBe('default')
  })

  it('evaluates conditions using context data', () => {
    const formula: SwitchOperation = {
      type: 'switch',
      cases: [
        {
          condition: { type: 'path', path: ['foo'] },
          formula: valueFormula('foo matched'),
        },
        { condition: valueFormula(true), formula: valueFormula('fallback') },
      ],
      default: valueFormula('default'),
    }
    const ctx = createTestFormulaContext({ foo: true })
    expect(applyEvaluateAllSwitchFormula(formula, ctx)).toBe('foo matched')
  })
})
