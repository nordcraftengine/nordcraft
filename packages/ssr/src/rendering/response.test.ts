import type { ComponentData, FormulaContext } from '@nordcraft/core'
import { describe, expect, test } from 'bun:test'
import { evaluateResponseHeaders } from './response'

describe('evaluateResponseHeaders', () => {
  const mockFormulaContext = {
    reportFormulaEvaluation: () => {},
  } as unknown as FormulaContext
  const mockData: ComponentData = {
    Page: {
      Theme: 'dark',
    },
  }

  test('it returns an empty object if responseHeaders is null', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: null,
      }),
    ).toEqual({})
  })

  test('it returns an empty object if responseHeaders is empty', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: {},
      }),
    ).toEqual({})
  })

  test('it evaluates static string headers', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: {
          'X-Custom-Header': 'static-value',
        } as any,
      }),
    ).toEqual({
      'X-Custom-Header': 'static-value',
    })
  })

  test('it evaluates formula headers', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: {
          'X-Theme': {
            type: 'path',
            path: ['Page', 'Theme'],
          },
          'X-Static': 'value',
        } as any,
      }),
    ).toEqual({
      'X-Theme': 'dark',
      'X-Static': 'value',
    })
  })

  test('it returns an empty object if responseHeaders is undefined', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: undefined,
      }),
    ).toEqual({})
  })

  test('it ignores formula headers that do not evaluate to a string', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: {
          'X-Not-A-String': {
            type: 'value',
            value: 123,
          },
        } as any,
      }),
    ).toEqual({})
  })

  test('it ignores non-string and non-formula values', () => {
    expect(
      evaluateResponseHeaders({
        formulaContext: mockFormulaContext,
        data: mockData,
        responseHeaders: {
          'X-Invalid': 123 as any,
        },
      }),
    ).toEqual({})
  })
})
