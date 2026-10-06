import { describe, expect, test } from 'bun:test'
import { isStaticFormula } from './isStaticFormula'

describe('isStaticFormula', () => {
  test('recognizes value formulas as static outside preview', () => {
    const prev = globalThis.IS_PREVIEW
    globalThis.IS_PREVIEW = false
    try {
      expect(isStaticFormula({ type: 'value', value: 4 })).toBe(true)
      expect(isStaticFormula({ type: 'value', value: null })).toBe(true)
      expect(isStaticFormula({ type: 'value', value: undefined })).toBe(true)
      expect(
        isStaticFormula({ type: 'path', path: ['Variables', 'count'] }),
      ).toBe(false)
      expect(
        isStaticFormula({
          type: 'function',
          name: '@toddle/add',
          arguments: [],
        }),
      ).toBe(false)
      expect(isStaticFormula(undefined)).toBe(false)
      expect(isStaticFormula(null)).toBe(false)
      expect(isStaticFormula(4)).toBe(false)
    } finally {
      globalThis.IS_PREVIEW = prev
    }
  })

  test('never static in preview so evaluation keeps being reported', () => {
    const prev = globalThis.IS_PREVIEW
    globalThis.IS_PREVIEW = true
    try {
      expect(isStaticFormula({ type: 'value', value: 4 })).toBe(false)
    } finally {
      globalThis.IS_PREVIEW = prev
    }
  })
})
