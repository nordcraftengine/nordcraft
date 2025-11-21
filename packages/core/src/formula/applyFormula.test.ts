import { describe, expect, it } from 'bun:test'
import type { ComponentFormula } from '../component/component.types'
import { applyApplyFormula } from './applyFormula'
import {
  applyFormula,
  type ApplyOperation,
  type FormulaContext,
} from './formula'
import { valueFormula } from './formulaUtils'
import { createTestFormulaContext } from './testUtils.test'

describe('applyApplyFormula', () => {
  it('applies a simple value formula from the component', () => {
    const componentFormula: ComponentFormula = {
      name: 'isSimple',
      formula: valueFormula(true),
    }
    const formula: ApplyOperation = {
      type: 'apply',
      name: 'isSimple',
      arguments: [],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: {
        formulas: { isSimple: componentFormula },
        name: 'TestComponent',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
      },
    }
    // The result should be the result of the inner formula (here, just the value of b)
    expect(applyFormula(formula, ctx, [])).toEqual(true)
  })
  it('applies a formula from the component with arguments', () => {
    const componentFormula: ComponentFormula = {
      name: 'sum',
      formula: {
        type: 'function',
        name: '@toddle/sum',
        arguments: [
          {
            name: 'Array',
            formula: {
              type: 'array',
              arguments: [
                {
                  formula: { type: 'path', path: ['Args', 'a'] },
                },
                {
                  formula: { type: 'path', path: ['Args', 'b'] },
                },
              ],
            },
            type: { type: 'Array' },
          },
        ],
      },
      arguments: [
        { name: 'a', testValue: 2 },
        { name: 'b', testValue: 3 },
      ],
    }
    const formula: ApplyOperation = {
      type: 'apply',
      name: 'sum',
      arguments: [
        { name: 'a', formula: valueFormula(2) },
        { name: 'b', formula: valueFormula(3) },
      ],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: {
        formulas: { sum: componentFormula },
        name: 'TestComponent',
        attributes: {},
        variables: {},
        apis: {},
        nodes: {},
      },
    }
    // The result should be the result of the inner formula (here, just the value of b)
    expect(applyFormula(formula, ctx, [])).toEqual(5)
  })

  it('returns null if the formula does not exist in the component', () => {
    const formula: ApplyOperation = {
      type: 'apply',
      name: 'missing',
      arguments: [],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: { formulas: {} } as any,
      env: { logErrors: true } as any,
    }
    expect(applyApplyFormula(formula, ctx)).toBeNull()
  })

  it('returns cached result if available', () => {
    const componentFormula = {
      name: 'cached',
      formula: valueFormula('cached-result'),
    }
    const formula: ApplyOperation = {
      type: 'apply',
      name: 'cached',
      arguments: [],
    }
    const cache = new Map()
    cache.set({}, { hit: true, data: 'from-cache' })
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: {
        formulas: { cached: componentFormula },
      } as any,
      formulaCache: {
        cached: {
          get: () => ({ hit: true, data: 'from-cache' }),
          set: () => {},
        },
      },
    }
    expect(applyApplyFormula(formula, ctx)).toBe('from-cache')
  })
})
