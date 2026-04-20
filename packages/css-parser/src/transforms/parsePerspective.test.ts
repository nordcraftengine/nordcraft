import { describe, expect, test } from 'bun:test'
import { parsePerspective } from './parsePerspective'

describe('parsePerspective', () => {
  describe('no perspective', () => {
    test('returns null', () => {
      expect(parsePerspective({})).toEqual(null)
    })
  })

  describe('keyword values', () => {
    test('parses none', () => {
      expect(
        parsePerspective({
          perspective: 'none',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'none',
      })
    })
  })

  describe('single values', () => {
    test('parses value', () => {
      expect(
        parsePerspective({
          perspective: '100px',
        }),
      ).toEqual({
        type: 'length',
        value: '100',
        unit: 'px',
      })
    })

    test('parses variable', () => {
      expect(
        parsePerspective({
          perspective: 'var(--variable)',
        }),
      ).toEqual({
        type: 'function',
        name: 'var',
        value: '--variable',
      })
    })
  })

  describe('global values', () => {
    test('parses value', () => {
      expect(
        parsePerspective({
          perspective: 'inherit',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'inherit',
      })
    })
  })

  describe('nonsense values', () => {
    test('parses value', () => {
      expect(
        parsePerspective({
          perspective: 'nonsense',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'nonsense',
      })
    })
  })
})
