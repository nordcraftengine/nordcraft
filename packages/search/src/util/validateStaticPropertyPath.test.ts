import { describe, expect, test } from 'bun:test'
import {
  getArgumentFormula,
  normalizePathSegments,
  validateStaticPath,
} from './validateStaticPropertyPath'

describe('validateStaticPropertyPath', () => {
  describe('getArgumentFormula', () => {
    test('finds formula by name', () => {
      const args = [
        { name: 'Path', formula: { type: 'value' as const, value: 'foo' } },
        { name: 'Object', formula: { type: 'value' as const, value: 42 } },
      ]
      expect(getArgumentFormula(args, 'Object', 0)).toEqual({
        type: 'value',
        value: 42,
      })
    })

    test('falls back to index when name is not found', () => {
      const args = [
        { formula: { type: 'value' as const, value: 10 } },
        { formula: { type: 'value' as const, value: 20 } },
      ]
      expect(getArgumentFormula(args, 'Object', 0)).toEqual({
        type: 'value',
        value: 10,
      })
      expect(getArgumentFormula(args, 'Path', 1)).toEqual({
        type: 'value',
        value: 20,
      })
    })

    test('returns undefined for empty/missing arguments', () => {
      expect(getArgumentFormula(undefined, 'Object', 0)).toBeUndefined()
      expect(getArgumentFormula([], 'Object', 0)).toBeUndefined()
    })
  })

  describe('normalizePathSegments', () => {
    test('normalizes string or number to single-element array', () => {
      expect(normalizePathSegments('foo')).toEqual(['foo'])
      expect(normalizePathSegments(0)).toEqual([0])
    })

    test('returns arrays directly', () => {
      expect(normalizePathSegments(['foo', 'bar'])).toEqual(['foo', 'bar'])
    })

    test('returns undefined for non-path values', () => {
      expect(normalizePathSegments(null)).toBeUndefined()
      expect(normalizePathSegments(undefined)).toBeUndefined()
      expect(normalizePathSegments({})).toBeUndefined()
    })
  })

  describe('validateStaticPath', () => {
    test('validates valid property on object', () => {
      expect(validateStaticPath({ foo: 'bar' }, ['foo'])).toEqual({
        isValid: true,
      })
    })

    test('validates valid nested properties', () => {
      expect(
        validateStaticPath({ user: { profile: { name: 'Alice' } } }, [
          'user',
          'profile',
          'name',
        ]),
      ).toEqual({ isValid: true })
    })

    test('reports invalid key on object', () => {
      expect(validateStaticPath({ foo: 'bar' }, ['baz'])).toEqual({
        isValid: false,
        invalidKey: 'baz',
      })
    })

    test('reports invalid key in nested object', () => {
      expect(
        validateStaticPath({ user: { name: 'Alice' } }, ['user', 'age']),
      ).toEqual({
        isValid: false,
        invalidKey: 'age',
      })
    })

    test('reports indexing into primitive or null', () => {
      expect(validateStaticPath({ val: null }, ['val', 'child'])).toEqual({
        isValid: false,
        invalidKey: 'child',
      })
      expect(validateStaticPath('hello', ['char'])).toEqual({
        isValid: false,
        invalidKey: 'char',
      })
    })

    test('validates array indexing', () => {
      expect(validateStaticPath(['a', 'b'], [0])).toEqual({ isValid: true })
      expect(validateStaticPath(['a', 'b'], ['1'])).toEqual({ isValid: true })
      expect(validateStaticPath(['a', 'b'], [2])).toEqual({
        isValid: false,
        invalidKey: 2,
      })
      expect(validateStaticPath(['a', 'b'], ['not-a-number'])).toEqual({
        isValid: false,
        invalidKey: 'not-a-number',
      })
    })

    test('returns true for empty segments', () => {
      expect(validateStaticPath({ a: 1 }, [])).toEqual({ isValid: true })
    })
  })
})
