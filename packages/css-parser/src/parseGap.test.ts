import { describe, expect, test } from 'bun:test'
import { getParsedGap } from './parseGap'

describe('getParsedGap', () => {
  describe('gap', () => {
    describe('no gap', () => {
      test('returns null', () => {
        expect(getParsedGap({})).toEqual(null)
      })
    })

    describe('one value', () => {
      test('sets both gaps', () => {
        expect(getParsedGap({ gap: '4px' })).toEqual({
          row: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
          column: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
        })
      })
    })

    describe('two values', () => {
      describe('values', () => {
        test('sets both gaps', () => {
          expect(getParsedGap({ gap: '4px 10%' })).toEqual({
            row: {
              type: 'length',
              value: '4',
              unit: 'px',
            },
            column: {
              type: 'length',
              value: '10',
              unit: '%',
            },
          })
        })
      })

      describe('variables', () => {
        test('sets both gaps', () => {
          expect(getParsedGap({ gap: 'var(--row) var(--column' })).toEqual({
            row: { type: 'function', value: '--row', name: 'var' },
            column: { type: 'function', value: '--column', name: 'var' },
          })
        })
      })
    })
  })

  describe('row-gap', () => {
    describe('by itself', () => {
      test('sets whatever value', () => {
        expect(getParsedGap({ 'row-gap': 'nonsense' })).toEqual({
          row: {
            type: 'keyword',
            value: 'nonsense',
          },
        })
      })
    })

    describe('defined before gap', () => {
      test('does not override', () => {
        expect(getParsedGap({ 'row-gap': '20px', gap: '4px 10%' })).toEqual({
          row: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
          column: {
            type: 'length',
            value: '10',
            unit: '%',
          },
        })
      })
    })

    describe('defined after gap', () => {
      test('overrides', () => {
        expect(getParsedGap({ gap: '4px 10%', 'row-gap': '20px' })).toEqual({
          row: {
            type: 'length',
            value: '20',
            unit: 'px',
          },
          column: {
            type: 'length',
            value: '10',
            unit: '%',
          },
        })
      })
    })

    describe('invalid', () => {
      describe('gap is valid', () => {
        test('does not override', () => {
          expect(
            getParsedGap({ gap: '4px 10%', 'row-gap': 'nonsense' }),
          ).toEqual({
            row: {
              type: 'length',
              value: '4',
              unit: 'px',
            },
            column: {
              type: 'length',
              value: '10',
              unit: '%',
            },
          })
        })
      })

      describe('gap is invalid', () => {
        test('overrides', () => {
          expect(
            getParsedGap({ gap: '4px nonsense', 'row-gap': 'nonsense' }),
          ).toEqual({
            row: {
              type: 'keyword',
              value: 'nonsense',
            },
            column: {
              type: 'keyword',
              value: 'nonsense',
            },
          })
        })
      })
    })
  })

  describe('column-gap', () => {
    describe('by itself', () => {
      test('sets whatever value', () => {
        expect(getParsedGap({ 'column-gap': 'nonsense' })).toEqual({
          column: {
            type: 'keyword',
            value: 'nonsense',
          },
        })
      })
    })

    describe('defined before gap', () => {
      test('does not override', () => {
        expect(getParsedGap({ 'column-gap': '20px', gap: '4px 10%' })).toEqual({
          row: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
          column: {
            type: 'length',
            value: '10',
            unit: '%',
          },
        })
      })
    })

    describe('defined after gap', () => {
      test('overrides', () => {
        expect(getParsedGap({ gap: '4px 10%', 'column-gap': '20px' })).toEqual({
          row: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
          column: {
            type: 'length',
            value: '20',
            unit: 'px',
          },
        })
      })
    })

    describe('invalid', () => {
      describe('gap is valid', () => {
        test('does not override', () => {
          expect(
            getParsedGap({ gap: '4px 10%', 'column-gap': 'nonsense' }),
          ).toEqual({
            row: {
              type: 'length',
              value: '4',
              unit: 'px',
            },
            column: {
              type: 'length',
              value: '10',
              unit: '%',
            },
          })
        })
      })

      describe('gap is invalid', () => {
        test('overrides', () => {
          expect(
            getParsedGap({ gap: 'nonsense 4px', 'column-gap': 'nonsense' }),
          ).toEqual({
            row: {
              type: 'keyword',
              value: 'nonsense',
            },
            column: {
              type: 'keyword',
              value: 'nonsense',
            },
          })
        })
      })
    })
  })
})
