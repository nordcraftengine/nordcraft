import type { Component } from '@nordcraft/core/dist/component/component.types'
import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { type FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { describe, expect, it } from 'bun:test'
import { evaluateAllComponentFormulas } from './formula'

// Helper to create a minimal context
function createContext(data: any = {}): FormulaContext {
  return {
    component: undefined,
    formulaCache: {},
    data,
    root: undefined,
    package: undefined,
    toddle: {
      getFormula: () => undefined,
      getCustomFormula: () => undefined,
      errors: [],
    },
    env: undefined,
    jsonPath: [],
  }
}

describe('evaluateFormulas', () => {
  it('evaluates all formulas in a simple component', () => {
    // Example component structure
    const component: Component = {
      name: 'test',
      attributes: {},
      variables: {},
      formulas: {
        a: {
          name: 'a',
          formula: { type: 'value', value: 123 },
        },
        b: {
          name: 'b',
          formula: { type: 'path', path: ['foo'] },
        },
      },
      apis: {},
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {
            test: { type: 'value', value: 'hello' },
            other: { type: 'path', path: ['bar'] },
          },
          classes: {},
          events: {},
          children: [],
          style: {},
        },
      },
    }

    const results = evaluateAllComponentFormulas({
      component: new ToddleComponent({
        component,
        getComponent: () => undefined,
        packageName: undefined,
        globalFormulas: {},
      }),
      formulaContext: createContext({ foo: 'bar', bar: 'baz' }),
    })
    expect(Object.keys(results).length).toEqual(4)
    expect(results['formulas/a/formula']).toBe(123)
    expect(results['formulas/b/formula']).toBe('bar')
    expect(results['nodes/root/attrs/test']).toBe('hello')
    expect(results['nodes/root/attrs/other']).toBe('baz')
  })
})
