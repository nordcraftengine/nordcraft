import { describe, expect, it } from 'bun:test'
import type { ComponentFormula } from '../component/component.types'
import { applyApplyFormula } from './applyFormula'
import {
  applyFormula,
  isFormula,
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

  it('can use built in formulas', () => {
    const formula = {
      type: 'function',
      name: '@toddle/string',
      arguments: [
        {
          name: 'Input',
          formula: { type: 'value', value: 'test' },
          type: { type: 'Any' },
        },
      ],
      display_name: 'String',
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: {
        formulas: {},
      } as any,
    }
    expect(applyFormula(formula as any, ctx)).toBe('test')
  })

  it('accepts data as a separate argument without modifying ctx', () => {
    const pathFormula = {
      type: 'path' as const,
      path: ['Variables', 'count'],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: { formulas: {}, name: 'Test' } as any,
    }
    expect(applyFormula(pathFormula, ctx, { Variables: { count: 42 } })).toBe(
      42,
    )
  })

  it('accepts data and path as separate arguments with reporting', () => {
    const results: Record<string, any> = {}
    const pathFormula = {
      type: 'path' as const,
      path: ['Variables', 'name'],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: { formulas: {}, name: 'Test' } as any,
      reportFormulaEvaluation: (path, result) => {
        results[path.join('/')] = result
      },
    }
    const data = { Variables: { name: 'Alice' } }
    const result = applyFormula(pathFormula, ctx, data, [
      'nodes',
      'text',
      'value',
    ])
    expect(result).toBe('Alice')
    expect(results['nodes/text/value']).toBe('Alice')
  })

  it('evaluates apply formula with passed data without creating new ctx', () => {
    const componentFormula: ComponentFormula = {
      name: 'getVal',
      formula: {
        type: 'path',
        path: ['Args', 'val'],
      },
      arguments: [{ name: 'val', testValue: 'default' }],
    }
    const formula: ApplyOperation = {
      type: 'apply',
      name: 'getVal',
      arguments: [
        {
          name: 'val',
          formula: { type: 'path', path: ['Variables', 'custom'] },
        },
      ],
    }
    const ctx: FormulaContext = {
      ...createTestFormulaContext(),
      component: {
        formulas: { getVal: componentFormula },
        name: 'Test',
      } as any,
    }
    const data = { Variables: { custom: 'from-data-arg' } }
    expect(applyFormula(formula, ctx, data)).toBe('from-data-arg')
  })
})

describe('isFormula()', () => {
  it('recognizes all supported formula types', () => {
    const formulas = [
      { type: 'path', path: ['Variables', 'foo'] },
      { type: 'function', name: '@toddle/add' },
      { type: 'value', value: 42 },
      { type: 'apply', name: 'myFormula' },
      { type: 'record', entries: [] },
      { type: 'object', arguments: [] },
      { type: 'array', arguments: [] },
      { type: 'or', arguments: [] },
      { type: 'and', arguments: [] },
      { type: 'switch', default: { type: 'value', value: null } },
    ]
    for (const formula of formulas) {
      expect(isFormula(formula)).toBe(true)
    }
  })

  it('rejects non-formula values', () => {
    expect(isFormula(null)).toBeFalsy()
    expect(isFormula(undefined)).toBeFalsy()
    expect(isFormula(42)).toBeFalsy()
    expect(isFormula('path')).toBeFalsy()
    expect(isFormula({ type: 'unknown' })).toBe(false)
    expect(isFormula({ type: 'PATH' })).toBe(false)
  })
})
