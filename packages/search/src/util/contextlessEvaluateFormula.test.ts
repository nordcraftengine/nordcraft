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
})
