import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { describe, expect, test } from 'bun:test'
import type { MemoFn } from '../types'
import {
  getActionsInComponent,
  getFormulasInComponent,
} from './componentTraversal'

const createMemo = (): MemoFn => {
  const map = new Map<string, any>()
  return ((key: string | string[], fn: () => any) => {
    const stringKey = Array.isArray(key) ? key.join('/') : key
    if (map.has(stringKey)) {
      return map.get(stringKey)
    }
    const result = fn()
    map.set(stringKey, result)
    return result
  }) as MemoFn
}

const component = new ToddleComponent({
  component: {
    name: 'test',
    nodes: {
      root: {
        type: 'element',
        tag: 'div',
        attrs: {
          title: { type: 'value', value: 'hi' },
        },
        events: {
          onClick: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'x',
                data: { type: 'value', value: 1 },
              },
            ],
          },
        },
      },
    },
    formulas: {},
    apis: {},
    attributes: {},
    variables: {},
  } as any,
  packageName: undefined,
  getComponent: () => undefined,
  globalFormulas: { formulas: {}, packages: {} },
})

describe('componentTraversal', () => {
  test('memoizes shared formula entries per component', () => {
    const memo = createMemo()
    const first = getFormulasInComponent(memo, component)
    const second = getFormulasInComponent(memo, component)
    expect(second).toBe(first)
    expect(first.length).toBeGreaterThan(0)
    expect(first.every(({ formula, path }) => formula && path)).toBe(true)
  })

  test('memoizes shared action entries per component', () => {
    const memo = createMemo()
    const first = getActionsInComponent(memo, component)
    const second = getActionsInComponent(memo, component)
    expect(second).toBe(first)
    expect(first).toHaveLength(1)
    expect(first[0]?.action.type).toBe('SetVariable')
  })
})
