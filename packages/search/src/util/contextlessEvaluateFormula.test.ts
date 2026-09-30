import { describe, expect, test } from 'bun:test'
import { contextlessEvaluateFormula } from './contextlessEvaluateFormula'

describe('contextlessEvaluateFormula', () => {
  test('should return `true` when the formula is a simple value formula', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'value',
        value: true,
      }),
    ).toEqual({
      isStatic: true,
      result: true,
    })
  })

  test('should not return a result and have `isStatic: false` when the formula uses a non-pure formula ("randomNumber", "Now")', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'apply',
        name: 'randomNumber',
        arguments: [],
      }),
    ).toEqual({
      isStatic: false,
      result: undefined,
    })

    expect(
      contextlessEvaluateFormula({
        type: 'apply',
        name: 'now',
        arguments: [],
      }),
    ).toEqual({
      isStatic: false,
      result: undefined,
    })
  })

  test('should not return a result and have `isStatic: false` when the formula depends on a variable', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'path',
        path: ['Variables', 'myVariable'],
      }),
    ).toEqual({
      isStatic: false,
      result: undefined,
    })
  })

  test('should return a result and static for an array formula where all args are array or value types', () => {
    expect(
      contextlessEvaluateFormula({
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
      }),
    ).toEqual({
      isStatic: true,
      result: [1, [2]],
    })
  })

  test('should return `isStatic: false` for an array formula with a non-static argument', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'array',
        arguments: [
          { formula: { type: 'value', value: 1 } },
          { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
        ],
      }),
    ).toEqual({
      isStatic: false,
      result: [
        1,
        undefined, // The second argument was not static
      ],
    })
  })

  test('should be static true for `And` formulas with no arguments', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'and',
        arguments: [],
      }),
    ).toEqual({
      isStatic: true,
      result: true,
    })
  })

  test('should be static false for `Or` formulas with no arguments', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'or',
        arguments: [],
      }),
    ).toEqual({
      isStatic: true,
      result: false,
    })
  })

  test('should be static true for `And` formulas with all static truthy arguments', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'and',
        arguments: [
          { formula: { type: 'value', value: true } },
          { formula: { type: 'value', value: true } },
        ],
      }),
    ).toEqual({
      isStatic: true,
      result: true,
    })
  })

  test('should not be static for `And` where any dynamic value exist', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'and',
        arguments: [
          { formula: { type: 'value', value: true } },
          { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
        ],
      }),
    ).toEqual({
      isStatic: false,
      result: undefined,
    })
  })

  test('should be static false for `And` when any argument is static false, even when dynamic arguments exist', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'and',
        arguments: [
          { formula: { type: 'value', value: true } },
          { formula: { type: 'path', path: ['Variables', 'myVariable'] } },
          { formula: { type: 'value', value: false } },
        ],
      }),
    ).toEqual({
      isStatic: true,
      result: false,
    })
  })

  test('should not be static for `Or` when any argument is dynamic and all static are falsy', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'or',
        arguments: [
          { formula: { type: 'value', value: false } },
          { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
        ],
      }),
    ).toEqual({
      isStatic: false,
      result: undefined,
    })
  })

  test('should be static true for `Or` when any argument is static true, even when dynamic arguments exist', () => {
    expect(
      contextlessEvaluateFormula({
        type: 'or',
        arguments: [
          { formula: { type: 'value', value: true } },
          { formula: { type: 'apply', name: 'randomNumber', arguments: [] } },
        ],
      }),
    ).toEqual({
      isStatic: true,
      result: true,
    })
  })

  describe('object formula', () => {
    test('should return static true and result when all properties are static', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'object',
          arguments: [
            { name: 'foo', formula: { type: 'value', value: 'bar' } },
            { name: 'num', formula: { type: 'value', value: 42 } },
          ],
        }),
      ).toEqual({
        isStatic: true,
        result: { foo: 'bar', num: 42 },
      })
    })

    test('should return isStatic: false when any property is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'object',
          arguments: [
            { name: 'foo', formula: { type: 'value', value: 'bar' } },
            {
              name: 'num',
              formula: { type: 'path', path: ['Variables', 'myNum'] },
            },
          ],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('record formula', () => {
    test('should support modern array format for record entries', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'record',
          entries: [
            { name: 'a', formula: { type: 'value', value: 1 } },
            { name: 'b', formula: { type: 'value', value: 2 } },
          ],
        }),
      ).toEqual({
        isStatic: true,
        result: { a: 1, b: 2 },
      })
    })

    test('should return isStatic: false for modern array format when an entry is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'record',
          entries: [
            { name: 'a', formula: { type: 'value', value: 1 } },
            {
              name: 'b',
              formula: { type: 'path', path: ['Variables', 'myVar'] },
            },
          ],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('switch formula', () => {
    test('should evaluate to static when the first matching case has static formula', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: true,
        result: 'first',
      })
    })

    test('should skip static false cases and take subsequent true case', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: true,
        result: 'second',
      })
    })

    test('should fall back to default when all conditions are static false', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'value', value: false },
              formula: { type: 'value', value: 'first' },
            },
          ],
          default: { type: 'value', value: 'default' },
        }),
      ).toEqual({
        isStatic: true,
        result: 'default',
      })
    })

    test('should be isStatic: false when a condition is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'path', path: ['Variables', 'cond'] },
              formula: { type: 'value', value: 'first' },
            },
          ],
          default: { type: 'value', value: 'default' },
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when the matching case formula is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'value', value: true },
              formula: { type: 'path', path: ['Variables', 'val'] },
            },
          ],
          default: { type: 'value', value: 'default' },
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('function formula (pure builtin lib formulas)', () => {
    test('should be static true for pure scalar formulas with static arguments', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/add',
          arguments: [
            { name: '0', formula: { type: 'value', value: 2 } },
            { name: '1', formula: { type: 'value', value: 3 } },
          ],
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/concatenate',
          arguments: [
            { name: '0', formula: { type: 'value', value: 'hello' } },
            { name: '1', formula: { type: 'value', value: 'world' } },
          ],
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })

      // Works without @toddle/ prefix as well
      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: 'multiply',
          arguments: [
            { name: '0', formula: { type: 'value', value: 4 } },
            { name: '1', formula: { type: 'value', value: 5 } },
          ],
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for pure scalar formulas with dynamic arguments', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/add',
          arguments: [
            { name: '0', formula: { type: 'value', value: 2 } },
            {
              name: '1',
              formula: { type: 'path', path: ['Variables', 'num'] },
            },
          ],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false when package is specified', () => {
      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: 'add',
          package: 'my-custom-package',
          arguments: [
            { name: '0', formula: { type: 'value', value: 1 } },
            { name: '1', formula: { type: 'value', value: 2 } },
          ],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false for non-deterministic or impure formulas', () => {
      // range is considered non-deterministic
      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/range',
          arguments: [
            { name: 'start', formula: { type: 'value', value: 0 } },
            { name: 'stop', formula: { type: 'value', value: 10 } },
          ],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: 'range',
          arguments: [],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/randomNumber',
          arguments: [],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/now',
          arguments: [],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/Id',
          arguments: [],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/currentURL',
          arguments: [],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })

      expect(
        contextlessEvaluateFormula({
          type: 'function',
          name: '@toddle/getCookie',
          arguments: [{ formula: { type: 'value', value: 'token' } }],
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })
  })

  describe('higher-order function formulas (map, filter, reduce)', () => {
    test('should be static true for map with static array and callback accessing Args.item', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for map when callback accesses Variables', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be isStatic: false for map when input array is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should be static true for filter with static array and predicate on Args', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be static true for reduce with static array, accumulator, and reducer', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })

    test('should be isStatic: false for reduce when accumulator is dynamic', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
      ).toEqual({
        isStatic: false,
        result: undefined,
      })
    })

    test('should handle nested higher-order formulas', () => {
      expect(
        contextlessEvaluateFormula({
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
        }),
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

    test('should resolve regular formulas from installed packages via ctx.packages or ctx.files', () => {
      expect(
        contextlessEvaluateFormula(
          {
            type: 'function',
            name: 'pkgFormula',
            package: 'my-package',
            arguments: [{ name: 'x', formula: { type: 'value', value: 5 } }],
          },
          {
            files: {
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
          },
        ),
      ).toEqual({
        isStatic: true,
        result: undefined,
      })
    })
  })
})
