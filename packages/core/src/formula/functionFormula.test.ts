import { describe, expect, it } from 'bun:test'
import type { FormulaHandlerV2 } from '../types'
import type { FunctionOperation } from './formula'
import type { PluginFormula } from './formulaTypes'
import { valueFormula } from './formulaUtils'
import { applyFunctionFormula } from './functionFormula'
import { createTestFormulaContext } from './testUtils.test'

const contextWithCustomFormulas = (
  formulas: Record<string, PluginFormula<FormulaHandlerV2>>,
) => {
  return {
    ...createTestFormulaContext(),
    toddle: {
      ...createTestFormulaContext().toddle,
      getCustomFormula: (name: string) => formulas[name],
    },
  }
}

describe('applyFunctionFormula', () => {
  it('returns the value of a simple function formula', () => {
    const ctx = contextWithCustomFormulas({
      identity: {
        version: 2,
        name: 'identity',
        handler: () => 42,
        arguments: [],
      },
    })
    expect(
      applyFunctionFormula(
        { type: 'function', name: 'identity', arguments: [] },
        ctx,
      ),
    ).toBe(42)
  })

  it('returns null if the function is not found', () => {
    const formula: FunctionOperation = {
      type: 'function',
      name: 'missing',
      arguments: [{ name: 'x', formula: valueFormula(1) }],
    }
    const ctx = contextWithCustomFormulas({})
    expect(applyFunctionFormula(formula, ctx)).toBeNull()
  })

  it('calls isFunction arguments as functions', () => {
    const formula: FunctionOperation = {
      type: 'function',
      name: 'fn',
      arguments: [
        {
          name: 'fn',
          isFunction: true,
          formula: valueFormula('called'),
        },
      ],
    }
    const ctx = contextWithCustomFormulas({
      fn: {
        version: 2,
        name: 'fn',
        handler: ({ fn }) => {
          return (fn as any)()
        },
        arguments: [{ name: 'fn' }],
      },
    })
    expect(applyFunctionFormula(formula, ctx)).toBe('called')
  })

  it('returns the result of a ToddleFormula', () => {
    const formula: FunctionOperation = {
      type: 'function',
      name: 'projectFormula',
      arguments: [],
    }
    const ctx = contextWithCustomFormulas({
      projectFormula: {
        name: 'projectFormula',
        arguments: [],
        formula: valueFormula([1, 2, 3]),
      },
    })
    expect(applyFunctionFormula(formula, ctx)).toEqual([1, 2, 3])
  })
})
