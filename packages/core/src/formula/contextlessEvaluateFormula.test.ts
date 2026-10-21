import { describe, expect, test } from 'bun:test'
import {
  compressFormula,
  contextlessEvaluateFormula,
  type EvaluationContext,
} from './contextlessEvaluateFormula'

const testCoreFormulas: Record<string, (...args: any[]) => any> = {
  add: ([a, b]: [number, number]) => a + b,
  '@toddle/add': ([a, b]: [number, number]) => a + b,
  multiply: ([a, b]: [number, number]) => a * b,
  '@toddle/multiply': ([a, b]: [number, number]) => a * b,
  concatenate: ([a, b]: [string, string]) => String(a) + String(b),
  '@toddle/concatenate': ([a, b]: [string, string]) => String(a) + String(b),
  greaterThan: ([a, b]: [number, number]) => a > b,
  '@toddle/greaterThan': ([a, b]: [number, number]) => a > b,
  map: ([items, fx]: [any[], (args: any) => any]) =>
    items.map((item, index) => fx({ item, index })),
  '@toddle/map': ([items, fx]: [any[], (args: any) => any]) =>
    items.map((item, index) => fx({ item, index })),
  filter: ([items, fx]: [any[], (args: any) => any]) =>
    items.filter((item, index) => fx({ item, index })),
  '@toddle/filter': ([items, fx]: [any[], (args: any) => any]) =>
    items.filter((item, index) => fx({ item, index })),
  reduce: ([items, fx, initial]: [any[], (args: any) => any, any]) =>
    items.reduce(
      (acc, item, index) => fx({ result: acc, item, index }),
      initial,
    ),
  '@toddle/reduce': ([items, fx, initial]: [any[], (args: any) => any, any]) =>
    items.reduce(
      (acc, item, index) => fx({ result: acc, item, index }),
      initial,
    ),
  get: ([collection, key]: [any, any]) => collection?.[key] ?? null,
  '@toddle/get': ([collection, key]: [any, any]) => collection?.[key] ?? null,
}

const testCtxWithCoreFormulas = (
  extra: EvaluationContext = {},
): EvaluationContext => {
  return {
    ...extra,
    toddle: {
      getFormula: (name: string) => testCoreFormulas[name],
      getCustomFormula: extra.toddle?.getCustomFormula,
      ...extra.toddle,
    },
  }
}

describe('contextlessEvaluateFormula', () => {
  describe('value formula', () => {
    test('should return `true` when the formula is a simple value formula', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'value',
            value: true,
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })
    })

    test('evaluates number and string value formulas', () => {
      expect(
        contextlessEvaluateFormula({ type: 'value', value: 123 }, {}),
      ).toEqual({
        isStatic: true,
        result: 123,
      })

      expect(
        contextlessEvaluateFormula({ type: 'value', value: 'hello' }, {}),
      ).toEqual({
        isStatic: true,
        result: 'hello',
      })
    })
  })

  describe('path formula', () => {
    test('should not return a result and have `isStatic: false` when the formula depends on a variable', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'path',
            path: ['Variables', 'myVariable'],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('array formula', () => {
    test('should return a result and static for an array formula where all args are array or value types', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'array',
            arguments: [
              { formula: { type: 'value', value: 1 } },
              {
                formula: {
                  type: 'array',
                  arguments: [{ formula: { type: 'value', value: 2 } }],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: [1, [2]],
      })
    })

    test('should return `isStatic: false` for an array formula with a non-static argument', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'array',
            arguments: [
              { formula: { type: 'value', value: 1 } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: [1, undefined],
      })
    })
  })

  describe('and / or formulas', () => {
    test('should be static true for `And` formulas with no arguments', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'and',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })
    })

    test('should be static false for `Or` formulas with no arguments', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'or',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: false,
      })
    })

    test('should be static true for `And` formulas with all static truthy arguments', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'and',
            arguments: [
              { formula: { type: 'value', value: true } },
              { formula: { type: 'value', value: true } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })

      // In Toddle/Nordcraft toBoolean semantics: 0, "", [], {} are truthy!
      expect(
        contextlessEvaluateFormula(
          {
            type: 'and',
            arguments: [
              { formula: { type: 'value', value: 0 } },
              { formula: { type: 'value', value: '' } },
              { formula: { type: 'value', value: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })
    })

    test('should not be static for `And` where any dynamic value exist', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'and',
            arguments: [
              { formula: { type: 'value', value: true } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be static false for `And` when any argument is static false, even when dynamic arguments exist', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'and',
            arguments: [
              { formula: { type: 'value', value: true } },
              { formula: { type: 'path', path: ['Variables', 'myVariable'] } },
              { formula: { type: 'value', value: false } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: false,
      })
    })

    test('should not be static for `Or` when any argument is dynamic and all static are falsy', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'or',
            arguments: [
              { formula: { type: 'value', value: false } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be static true for `Or` when any argument is static true, even when dynamic arguments exist', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'or',
            arguments: [
              { formula: { type: 'value', value: true } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })

      // In Toddle/Nordcraft toBoolean semantics: 0 and "" are truthy
      expect(
        contextlessEvaluateFormula(
          {
            type: 'or',
            arguments: [
              { formula: { type: 'value', value: 0 } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'or',
            arguments: [
              { formula: { type: 'value', value: '' } },
              { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: true,
      })
    })
  })

  describe('object formula', () => {
    test('should return static true and result when all properties are static', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'object',
            arguments: [
              { name: 'foo', formula: { type: 'value', value: 'bar' } },
              { name: 'num', formula: { type: 'value', value: 42 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: { foo: 'bar', num: 42 },
      })
    })

    test('should return isStatic: false when any property is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'object',
            arguments: [
              { name: 'foo', formula: { type: 'value', value: 'bar' } },
              {
                name: 'num',
                formula: { type: 'path', path: ['Variables', 'myNum'] },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('record formula', () => {
    test('should support modern array format for record entries', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'record',
            entries: [
              { name: 'a', formula: { type: 'value', value: 1 } },
              { name: 'b', formula: { type: 'value', value: 2 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: { a: 1, b: 2 },
      })
    })

    test('should return isStatic: false for modern array format when an entry is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'record',
            entries: [
              { name: 'a', formula: { type: 'value', value: 1 } },
              {
                name: 'b',
                formula: { type: 'path', path: ['Variables', 'myVar'] },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('switch formula', () => {
    test('should evaluate to static when the first matching case has static formula', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'value', value: true },
                formula: { type: 'value', value: 'first' },
              },
              {
                condition: { type: 'value', value: false },
                formula: { type: 'value', value: 'second' },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: 'first',
      })

      // 0 is truthy in toBoolean
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'value', value: 0 },
                formula: { type: 'value', value: 'zero-branch' },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: 'zero-branch',
      })
    })

    test('should skip static false cases and take subsequent true case', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'value', value: false },
                formula: { type: 'value', value: 'first' },
              },
              {
                condition: { type: 'value', value: true },
                formula: { type: 'value', value: 'second' },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: 'second',
      })
    })

    test('should fall back to default when all conditions are static false', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'value', value: false },
                formula: { type: 'value', value: 'first' },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: 'default',
      })
    })

    test('should be isStatic: false when a condition is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'path', path: ['Variables', 'cond'] },
                formula: { type: 'value', value: 'first' },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when the matching case formula is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'switch',
            cases: [
              {
                condition: { type: 'value', value: true },
                formula: { type: 'path', path: ['Variables', 'val'] },
              },
            ],
            default: { type: 'value', value: 'default' },
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('function formula (pure builtin lib formulas)', () => {
    test('should be static true for pure scalar formulas with static arguments', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/add',
            arguments: [
              { name: '0', formula: { type: 'value', value: 2 } },
              { name: '1', formula: { type: 'value', value: 3 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: { type: 'value', value: 'hello' } },
              { name: '1', formula: { type: 'value', value: 'world' } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })

      // Works without @toddle/ prefix as well
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'multiply',
            arguments: [
              { name: '0', formula: { type: 'value', value: 4 } },
              { name: '1', formula: { type: 'value', value: 5 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for pure scalar formulas with dynamic arguments', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/add',
            arguments: [
              { name: '0', formula: { type: 'value', value: 2 } },
              {
                name: '1',
                formula: { type: 'path', path: ['Variables', 'num'] },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when package is specified', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'add',
            package: 'my-custom-package',
            arguments: [
              { name: '0', formula: { type: 'value', value: 1 } },
              { name: '1', formula: { type: 'value', value: 2 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false for non-deterministic or impure formulas', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/range',
            arguments: [
              { name: 'start', formula: { type: 'value', value: 0 } },
              { name: 'stop', formula: { type: 'value', value: 10 } },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'range',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/randomNumber',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/now',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/Id',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/currentURL',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/getCookie',
            arguments: [{ formula: { type: 'value', value: 'token' } }],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('higher-order function formulas (map, filter, reduce)', () => {
    test('should be static true for map with static array and callback accessing Args.item', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/map',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 2 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/multiply',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    { name: '1', formula: { type: 'value', value: 2 } },
                  ],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for map when callback accesses Variables', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/map',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [{ formula: { type: 'value', value: 1 } }],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/multiply',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    {
                      name: '1',
                      formula: {
                        type: 'path',
                        path: ['Variables', 'multiplier'],
                      },
                    },
                  ],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false for map when input array is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/map',
            arguments: [
              {
                name: 'Array',
                formula: { type: 'path', path: ['Variables', 'myList'] },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'path',
                  path: ['Args', 'item'],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be static true for filter with static array and predicate on Args', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/filter',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 2 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/greaterThan',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    { name: '1', formula: { type: 'value', value: 1 } },
                  ],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be static true for reduce with static array, accumulator, and reducer', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/reduce',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 2 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/add',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'result'] },
                    },
                    {
                      name: '1',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                  ],
                },
              },
              {
                name: 'Accumulator',
                formula: { type: 'value', value: 0 },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for reduce when accumulator is dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/reduce',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [{ formula: { type: 'value', value: 1 } }],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'path',
                  path: ['Args', 'result'],
                },
              },
              {
                name: 'Accumulator',
                formula: { type: 'path', path: ['Variables', 'initial'] },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should handle nested higher-order formulas', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/map',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    {
                      formula: {
                        type: 'array',
                        arguments: [{ formula: { type: 'value', value: 1 } }],
                      },
                    },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/map',
                  arguments: [
                    {
                      name: 'Array',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    {
                      name: 'Formula',
                      isFunction: true,
                      formula: {
                        type: 'path',
                        path: ['Args', 'item'],
                      },
                    },
                  ],
                },
              },
            ],
          },
          {},
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })
  })

  describe('global/project formulas', () => {
    test('should be static true when referencing a regular project formula with static body and args', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'myCustomFormula',
            arguments: [{ name: 'val', formula: { type: 'value', value: 10 } }],
          },
          {
            formulas: {
              myCustomFormula: {
                name: 'myCustomFormula',
                arguments: [{ name: 'val' }],
                formula: {
                  type: 'function',
                  name: '@toddle/multiply',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'val'] },
                    },
                    { name: '1', formula: { type: 'value', value: 2 } },
                  ],
                },
              },
            },
          },
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false when referencing a code formula (real code)', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'myCodeFormula',
            arguments: [{ name: 'val', formula: { type: 'value', value: 10 } }],
          },
          {
            formulas: {
              myCodeFormula: {
                name: 'myCodeFormula',
                arguments: [{ name: 'val' }],
                handler: 'return val * 2',
              },
            },
          },
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when arguments to regular project formula are dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'myCustomFormula',
            arguments: [
              {
                name: 'val',
                formula: { type: 'path', path: ['Variables', 'count'] },
              },
            ],
          },
          {
            formulas: {
              myCustomFormula: {
                name: 'myCustomFormula',
                arguments: [{ name: 'val' }],
                formula: {
                  type: 'path',
                  path: ['Args', 'val'],
                },
              },
            },
          },
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when regular project formula body references external state', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'myCustomFormula',
            arguments: [{ name: 'val', formula: { type: 'value', value: 10 } }],
          },
          {
            formulas: {
              myCustomFormula: {
                name: 'myCustomFormula',
                arguments: [{ name: 'val' }],
                formula: {
                  type: 'path',
                  path: ['Variables', 'externalVar'],
                },
              },
            },
          },
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should prevent infinite loops and mark cyclic project formulas as isStatic: false', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'formulaA',
            arguments: [],
          },
          {
            formulas: {
              formulaA: {
                name: 'formulaA',
                arguments: [],
                formula: {
                  type: 'function',
                  name: 'formulaB',
                  arguments: [],
                },
              },
              formulaB: {
                name: 'formulaB',
                arguments: [],
                formula: {
                  type: 'function',
                  name: 'formulaA',
                  arguments: [],
                },
              },
            },
          },
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should resolve regular formulas from installed packages via ctx.packages', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'pkgFormula',
            package: 'my-package',
            arguments: [{ name: 'x', formula: { type: 'value', value: 5 } }],
          },
          {
            packages: {
              'my-package': {
                formulas: {
                  pkgFormula: {
                    name: 'pkgFormula',
                    arguments: [{ name: 'x' }],
                    formula: {
                      type: 'function',
                      name: '@toddle/add',
                      arguments: [
                        {
                          name: '0',
                          formula: { type: 'path', path: ['Args', 'x'] },
                        },
                        { name: '1', formula: { type: 'value', value: 1 } },
                      ],
                    },
                  },
                },
              },
            },
          },
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })
  })

  describe('pure lib formulas with concrete result (when handlers provided)', () => {
    test('returns static true with actual result for pure scalar formulas when getFormula is provided', () => {
      const ctx = testCtxWithCoreFormulas()

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/add',
            arguments: [
              { name: '0', formula: { type: 'value', value: 10 } },
              { name: '1', formula: { type: 'value', value: 25 } },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: 35,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: { type: 'value', value: 'foo' } },
              { name: '1', formula: { type: 'value', value: 'bar' } },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: 'foobar',
      })

      // Legitimate null return
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/get',
            arguments: [
              { name: '0', formula: { type: 'value', value: { a: 1 } } },
              { name: '1', formula: { type: 'value', value: 'b' } },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: null,
      })
    })

    test('evaluates higher-order pure lib formulas to concrete result', () => {
      const ctx = testCtxWithCoreFormulas()

      // map
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/map',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 2 } },
                    { formula: { type: 'value', value: 3 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/multiply',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    { name: '1', formula: { type: 'value', value: 2 } },
                  ],
                },
              },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: [2, 4, 6],
      })

      // filter
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/filter',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 5 } },
                    { formula: { type: 'value', value: 2 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/greaterThan',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                    { name: '1', formula: { type: 'value', value: 2 } },
                  ],
                },
              },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: [5],
      })

      // reduce
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: '@toddle/reduce',
            arguments: [
              {
                name: 'Array',
                formula: {
                  type: 'array',
                  arguments: [
                    { formula: { type: 'value', value: 1 } },
                    { formula: { type: 'value', value: 2 } },
                    { formula: { type: 'value', value: 3 } },
                  ],
                },
              },
              {
                name: 'Formula',
                isFunction: true,
                formula: {
                  type: 'function',
                  name: '@toddle/add',
                  arguments: [
                    {
                      name: '0',
                      formula: { type: 'path', path: ['Args', 'result'] },
                    },
                    {
                      name: '1',
                      formula: { type: 'path', path: ['Args', 'item'] },
                    },
                  ],
                },
              },
              {
                name: 'Accumulator',
                formula: { type: 'value', value: 10 },
              },
            ],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: 16,
      })
    })

    test('evaluates regular project formula that legitimately returns null', () => {
      const ctx = testCtxWithCoreFormulas({
        formulas: {
          returnNull: {
            name: 'returnNull',
            arguments: [],
            formula: {
              type: 'value',
              value: null,
            },
          },
        },
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'returnNull',
            arguments: [],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: null,
      })
    })

    test('evaluates regular project formula to actual static result', () => {
      const ctx = testCtxWithCoreFormulas({
        formulas: {
          doubleVal: {
            name: 'doubleVal',
            arguments: [{ name: 'val' }],
            formula: {
              type: 'function',
              name: '@toddle/multiply',
              arguments: [
                {
                  name: '0',
                  formula: { type: 'path', path: ['Args', 'val'] },
                },
                { name: '1', formula: { type: 'value', value: 2 } },
              ],
            },
          },
        },
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'doubleVal',
            arguments: [{ name: 'val', formula: { type: 'value', value: 21 } }],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: 42,
      })
    })
  })

  describe('component formulas (apply)', () => {
    test('evaluates component formulas to concrete static result', () => {
      const ctx = testCtxWithCoreFormulas({
        component: {
          name: 'MyComponent',
          formulas: {
            addOne: {
              name: 'addOne',
              arguments: [{ name: 'x', testValue: 0 }],
              formula: {
                type: 'function',
                name: '@toddle/add',
                arguments: [
                  {
                    name: '0',
                    formula: { type: 'path', path: ['Args', 'x'] },
                  },
                  { name: '1', formula: { type: 'value', value: 1 } },
                ],
              },
            },
          },
        } as any,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'apply',
            name: 'addOne',
            arguments: [{ name: 'x', formula: { type: 'value', value: 99 } }],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: 100,
      })
    })

    test('evaluates component formula that legitimately returns null', () => {
      const ctx = testCtxWithCoreFormulas({
        component: {
          name: 'MyComponent',
          formulas: {
            giveMeNull: {
              name: 'giveMeNull',
              arguments: [],
              formula: {
                type: 'value',
                value: null,
              },
            },
          },
        } as any,
      })

      expect(
        contextlessEvaluateFormula(
          {
            type: 'apply',
            name: 'giveMeNull',
            arguments: [],
          },
          ctx,
        ),
      ).toEqual({
        isStatic: true,
        result: null,
      })
    })

    test('returns isStatic: false if component formula is missing or dynamic', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'apply',
            name: 'missing',
            arguments: [],
          },
          {},
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      const ctxWithDynamic = {
        component: {
          name: 'MyComponent',
          formulas: {
            dynamicFormula: {
              name: 'dynamicFormula',
              formula: {
                type: 'path',
                path: ['Variables', 'myVar'],
              },
            },
          },
        } as any,
      }

      expect(
        contextlessEvaluateFormula(
          {
            type: 'apply',
            name: 'dynamicFormula',
            arguments: [],
          },
          ctxWithDynamic,
        ),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('compressFormula', () => {
    test('compresses a completely static formula to a value formula', () => {
      const ctx = testCtxWithCoreFormulas()

      const formula = {
        type: 'function' as const,
        name: '@toddle/add',
        arguments: [
          { name: '0', formula: { type: 'value' as const, value: 5 } },
          { name: '1', formula: { type: 'value' as const, value: 7 } },
        ],
      }

      expect(compressFormula(formula, ctx)).toEqual({
        type: 'value',
        value: 12,
      })
    })

    test('compresses nested static subtrees within a dynamic parent formula', () => {
      const ctx = testCtxWithCoreFormulas()

      const formula = {
        type: 'function' as const,
        name: '@toddle/add',
        arguments: [
          {
            name: '0',
            formula: {
              type: 'function' as const,
              name: '@toddle/multiply',
              arguments: [
                { name: '0', formula: { type: 'value' as const, value: 3 } },
                { name: '1', formula: { type: 'value' as const, value: 4 } },
              ],
            },
          },
          {
            name: '1',
            formula: {
              type: 'path' as const,
              path: ['Variables', 'count'],
            },
          },
        ],
      }

      expect(compressFormula(formula, ctx)).toEqual({
        type: 'function',
        name: '@toddle/add',
        arguments: [
          {
            name: '0',
            formula: {
              type: 'value',
              value: 12,
            },
          },
          {
            name: '1',
            formula: {
              type: 'path',
              path: ['Variables', 'count'],
            },
          },
        ],
      })
    })

    test('prunes dead branches and simplifies switch formulas', () => {
      const ctx = testCtxWithCoreFormulas()

      // Switch where first case is false and second case is dynamic
      const switchWithDeadBranch = {
        type: 'switch' as const,
        cases: [
          {
            condition: { type: 'value' as const, value: false },
            formula: { type: 'value' as const, value: 'never' },
          },
          {
            condition: { type: 'path' as const, path: ['Variables', 'isTrue'] },
            formula: {
              type: 'function' as const,
              name: '@toddle/add',
              arguments: [
                { name: '0', formula: { type: 'value' as const, value: 1 } },
                { name: '1', formula: { type: 'value' as const, value: 2 } },
              ],
            },
          },
        ],
        default: { type: 'value' as const, value: 'default' },
      }

      expect(compressFormula(switchWithDeadBranch, ctx)).toEqual({
        type: 'switch',
        cases: [
          {
            condition: { type: 'path', path: ['Variables', 'isTrue'] },
            formula: { type: 'value', value: 3 },
          },
        ],
        default: { type: 'value', value: 'default' },
      })
    })

    test('collapses switch to taken branch if static true is encountered', () => {
      const ctx = testCtxWithCoreFormulas()

      const switchWithKnownBranch = {
        type: 'switch' as const,
        cases: [
          {
            condition: { type: 'value' as const, value: false },
            formula: { type: 'value' as const, value: 'unreachable' },
          },
          {
            condition: { type: 'value' as const, value: true },
            formula: {
              type: 'function' as const,
              name: '@toddle/concatenate',
              arguments: [
                {
                  name: '0',
                  formula: { type: 'value' as const, value: 'hello ' },
                },
                {
                  name: '1',
                  formula: { type: 'value' as const, value: 'world' },
                },
              ],
            },
          },
          {
            condition: { type: 'path' as const, path: ['Variables', 'later'] },
            formula: { type: 'value' as const, value: 'ignored' },
          },
        ],
        default: { type: 'value' as const, value: 'default' },
      }

      expect(compressFormula(switchWithKnownBranch, ctx)).toEqual({
        type: 'value',
        value: 'hello world',
      })

      // 0 is truthy in toBoolean, so it takes that branch
      const switchWithZeroCondition = {
        type: 'switch' as const,
        cases: [
          {
            condition: { type: 'value' as const, value: 0 },
            formula: { type: 'value' as const, value: 'taken-zero' },
          },
        ],
        default: { type: 'value' as const, value: 'default' },
      }

      expect(compressFormula(switchWithZeroCondition, ctx)).toEqual({
        type: 'value',
        value: 'taken-zero',
      })
    })

    test('short-circuits and/or formulas with dynamic subformulas', () => {
      const andFormula = {
        type: 'and' as const,
        arguments: [
          { formula: { type: 'value' as const, value: false } },
          { formula: { type: 'path' as const, path: ['Variables', 'test'] } },
        ],
      }

      expect(compressFormula(andFormula, {})).toEqual({
        type: 'value',
        value: false,
      })

      const orFormula = {
        type: 'or' as const,
        arguments: [
          { formula: { type: 'value' as const, value: true } },
          { formula: { type: 'path' as const, path: ['Variables', 'test'] } },
        ],
      }

      expect(compressFormula(orFormula, {})).toEqual({
        type: 'value',
        value: true,
      })
    })
  })
})
