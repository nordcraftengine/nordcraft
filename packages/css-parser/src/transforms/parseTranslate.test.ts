import { describe, expect, test } from 'bun:test'
import { parseTranslate } from './parseTranslate'

describe('parseTranslate', () => {
  describe('no translate', () => {
    test('returns null', () => {
      expect(parseTranslate({})).toEqual(null)
    })
  })

  describe('keyword values', () => {
    test('parses none', () => {
      expect(
        parseTranslate({
          translate: 'none',
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
        parseTranslate({
          translate: '100px',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '100',
          unit: 'px',
        },
      })
    })

    test('parses variable', () => {
      expect(
        parseTranslate({
          translate: 'var(--variable)',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'function',
          name: 'var',
          value: '--variable',
        },
      })
    })
  })

  describe('two values', () => {
    test('parses values', () => {
      expect(
        parseTranslate({
          translate: '100px 50%',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '100',
          unit: 'px',
        },
        y: {
          type: 'length',
          value: '50',
          unit: '%',
        },
      })
    })

    test('parses value and variable', () => {
      expect(
        parseTranslate({
          translate: 'var(--variable) 50%',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'function',
          name: 'var',
          value: '--variable',
        },
        y: {
          type: 'length',
          value: '50',
          unit: '%',
        },
      })
    })
  })

  describe('three values', () => {
    test('parses values', () => {
      expect(
        parseTranslate({
          translate: '100px 50% 5rem',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '100',
          unit: 'px',
        },
        y: {
          type: 'length',
          value: '50',
          unit: '%',
        },
        z: {
          type: 'length',
          value: '5',
          unit: 'rem',
        },
      })
    })

    test('parses values and variables', () => {
      expect(
        parseTranslate({
          translate: '100px var(--variable) 5rem',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '100',
          unit: 'px',
        },
        y: {
          type: 'function',
          name: 'var',
          value: '--variable',
        },
        z: {
          type: 'length',
          value: '5',
          unit: 'rem',
        },
      })
    })
  })

  describe('global values', () => {
    test('parses value', () => {
      expect(
        parseTranslate({
          translate: 'inherit',
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
        parseTranslate({
          translate: 'nonsense',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'nonsense',
      })
    })
  })
})
