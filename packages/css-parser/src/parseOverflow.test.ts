import { describe, expect, test } from 'bun:test'
import { getParsedOverflow } from './parseOverflow'

describe('getParsedOverflow', () => {
  describe('overflow', () => {
    describe('no overflow', () => {
      test('returns null', () => {
        expect(getParsedOverflow({})).toEqual(null)
      })
    })

    describe('one value', () => {
      test('sets both overflows', () => {
        expect(getParsedOverflow({ overflow: 'hidden' })).toEqual({
          x: {
            type: 'keyword',
            value: 'hidden',
          },
          y: {
            type: 'keyword',
            value: 'hidden',
          },
        })
      })
    })

    describe('two values', () => {
      describe('values', () => {
        test('sets both overflows', () => {
          expect(getParsedOverflow({ overflow: 'hidden auto' })).toEqual({
            x: {
              type: 'keyword',
              value: 'hidden',
            },
            y: {
              type: 'keyword',
              value: 'auto',
            },
          })
        })
      })

      describe('variables', () => {
        test('sets both overflows', () => {
          expect(
            getParsedOverflow({
              overflow: 'var(--overflow-x) var(--overflow-y',
            }),
          ).toEqual({
            x: { type: 'function', value: '--overflow-x', name: 'var' },
            y: { type: 'function', value: '--overflow-y', name: 'var' },
          })
        })
      })
    })
  })

  describe('overflow-x', () => {
    describe('by itself', () => {
      test('sets whatever value', () => {
        expect(getParsedOverflow({ 'overflow-x': 'nonsense' })).toEqual({
          x: {
            type: 'keyword',
            value: 'nonsense',
          },
        })
      })
    })

    describe('defined before overflow', () => {
      test('does not override', () => {
        expect(
          getParsedOverflow({ 'overflow-x': 'hidden', overflow: 'auto' }),
        ).toEqual({
          x: {
            type: 'keyword',
            value: 'auto',
          },
          y: {
            type: 'keyword',
            value: 'auto',
          },
        })
      })
    })

    describe('defined after overflow', () => {
      test('overrides', () => {
        expect(
          getParsedOverflow({ overflow: 'auto', 'overflow-x': 'hidden' }),
        ).toEqual({
          x: {
            type: 'keyword',
            value: 'hidden',
          },
          y: {
            type: 'keyword',
            value: 'auto',
          },
        })
      })
    })

    describe('invalid', () => {
      describe('overflow is valid', () => {
        test('does not override', () => {
          expect(
            getParsedOverflow({ overflow: 'auto', 'overflow-x': 'nonsense' }),
          ).toEqual({
            x: {
              type: 'keyword',
              value: 'auto',
            },
            y: {
              type: 'keyword',
              value: 'auto',
            },
          })
        })
      })

      describe('overflow is invalid', () => {
        test('overrides', () => {
          expect(
            getParsedOverflow({
              overflow: 'auto nonsense',
              'overflow-x': 'nonsense',
            }),
          ).toEqual({
            x: {
              type: 'keyword',
              value: 'nonsense',
            },
            y: {
              type: 'keyword',
              value: 'nonsense',
            },
          })
        })
      })
    })
  })

  describe('overflow-y', () => {
    describe('by itself', () => {
      test('sets whatever value', () => {
        expect(getParsedOverflow({ 'overflow-y': 'nonsense' })).toEqual({
          y: {
            type: 'keyword',
            value: 'nonsense',
          },
        })
      })
    })

    describe('defined before overflow', () => {
      test('does not override', () => {
        expect(
          getParsedOverflow({
            'overflow-y': 'hidden',
            overflow: 'auto visible',
          }),
        ).toEqual({
          x: {
            type: 'keyword',
            value: 'auto',
          },
          y: {
            type: 'keyword',
            value: 'visible',
          },
        })
      })
    })

    describe('defined after overflow', () => {
      test('overrides', () => {
        expect(
          getParsedOverflow({
            overflow: 'auto visible',
            'overflow-y': 'hidden',
          }),
        ).toEqual({
          x: {
            type: 'keyword',
            value: 'auto',
          },
          y: {
            type: 'keyword',
            value: 'hidden',
          },
        })
      })
    })

    describe('invalid', () => {
      describe('overflow is valid', () => {
        test('does not override', () => {
          expect(
            getParsedOverflow({
              overflow: 'auto visible',
              'overflow-y': 'nonsense',
            }),
          ).toEqual({
            x: {
              type: 'keyword',
              value: 'auto',
            },
            y: {
              type: 'keyword',
              value: 'visible',
            },
          })
        })
      })

      describe('overflow is invalid', () => {
        test('overrides', () => {
          expect(
            getParsedOverflow({
              overflow: 'visible pizza',
              'overflow-y': 'nonsense',
            }),
          ).toEqual({
            x: {
              type: 'keyword',
              value: 'visible',
            },
            y: {
              type: 'keyword',
              value: 'nonsense',
            },
          })
        })
      })
    })
  })
})
