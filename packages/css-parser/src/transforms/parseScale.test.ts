import { describe, expect, test } from 'bun:test'
import { parseScale } from './parseScale'

describe('parseScale', () => {
  describe('no scale', () => {
    test('returns null', () => {
      expect(parseScale({})).toEqual(null)
    })
  })

  describe('keyword values', () => {
    test('parses none', () => {
      expect(
        parseScale({
          scale: 'none',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'none',
      })
    })
  })

  describe('single values', () => {
    test('parses number', () => {
      expect(
        parseScale({
          scale: '2',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'number',
          value: '2',
        },
      })
    })

    test('parses value', () => {
      expect(
        parseScale({
          scale: '200%',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '200',
          unit: '%',
        },
      })
    })

    test('parses variable', () => {
      expect(
        parseScale({
          scale: 'var(--variable)',
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
        parseScale({
          scale: '1 50%',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'number',
          value: '1',
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
        parseScale({
          scale: 'var(--variable) 50%',
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
        parseScale({
          scale: '2 50% 1',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'number',
          value: '2',
        },
        y: {
          type: 'length',
          value: '50',
          unit: '%',
        },
        z: {
          type: 'number',
          value: '1',
        },
      })
    })

    test('parses values and variables', () => {
      expect(
        parseScale({
          scale: '50% var(--variable) 2',
        }),
      ).toEqual({
        type: 'axis',
        x: {
          type: 'length',
          value: '50',
          unit: '%',
        },
        y: {
          type: 'function',
          name: 'var',
          value: '--variable',
        },
        z: {
          type: 'number',
          value: '2',
        },
      })
    })
  })

  describe('global values', () => {
    test('parses value', () => {
      expect(
        parseScale({
          scale: 'inherit',
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
        parseScale({
          scale: 'nonsense',
        }),
      ).toEqual({
        type: 'keyword',
        value: 'nonsense',
      })
    })
  })
})
