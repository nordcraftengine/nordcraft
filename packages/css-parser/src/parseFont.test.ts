import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('parseFont', () => {
  test('The font shorthand property is defined', () => {
    expect(
      parseCss({
        style: {
          font: 'oblique 45deg small-caps bold condensed 16px/2 cursive',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'keyword',
              value: 'cursive',
            },
          ],
          size: {
            type: 'length',
            value: '16',
            unit: 'px',
          },
          lineHeight: {
            type: 'number',
            value: '2',
          },
          stretch: {
            type: 'keyword',
            value: 'condensed',
          },
          style: {
            angle: { type: 'angle', value: '45', unit: 'deg' },
            style: {
              type: 'keyword',
              value: 'oblique',
            },
          },
          variant: {
            type: 'keyword',
            value: 'small-caps',
          },
          weight: {
            type: 'keyword',
            value: 'bold',
          },
        },
      }),
    )
  })

  test('Only family and size are defined', () => {
    expect(
      parseCss({
        style: {
          font: '16px "Fira Code"',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'string',
              value: 'Fira Code',
              quote: '"',
            },
          ],
          size: {
            type: 'length',
            value: '16',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Only size is defined', () => {
    expect(
      parseCss({
        style: {
          font: '16px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [],
          size: {
            type: 'length',
            value: '16',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Use defined variable as font size', () => {
    expect(
      parseCss({
        style: {
          font: 'var(--fontSize) / 16px "Fira Code"',
        },
        variables: {
          'font-size': [
            {
              name: 'fontSize',
              type: 'value',
              value: '12px',
              category: 'font-size',
            },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'string',
              value: 'Fira Code',
              quote: '"',
            },
          ],
          lineHeight: {
            type: 'length',
            value: '16',
            unit: 'px',
          },
          size: {
            type: 'function',
            name: 'var',
            value: '--fontSize',
          },
        },
      }),
    )
  })

  test('If undefined variables return the values in order', () => {
    expect(
      parseCss({
        style: {
          font: 'oblique 45deg small-caps bold condensed var(--size)/2 cursive',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'keyword',
              value: 'cursive',
            },
          ],
          size: {
            name: 'var',
            type: 'function',
            value: '--size',
          },
          lineHeight: {
            type: 'number',
            value: '2',
          },
          stretch: {
            type: 'keyword',
            value: 'condensed',
          },
          style: {
            angle: { type: 'angle', value: '45', unit: 'deg' },
            style: {
              type: 'keyword',
              value: 'oblique',
            },
          },
          variant: {
            type: 'keyword',
            value: 'small-caps',
          },
          weight: {
            type: 'keyword',
            value: 'bold',
          },
        },
      }),
    )
  })

  test('Return the invalid values', () => {
    expect(
      parseCss({
        style: {
          font: 'oblique 45deg small-caps invalidValue condensed 14px/2 cursive, serif',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'keyword',
              value: 'cursive',
            },
            {
              type: 'keyword',
              value: 'serif',
            },
          ],
          size: {
            type: 'length',
            value: '14',
            unit: 'px',
          },
          lineHeight: {
            type: 'number',
            value: '2',
          },
          stretch: {
            type: 'keyword',
            value: 'condensed',
          },
          style: {
            angle: { type: 'angle', value: '45', unit: 'deg' },
            style: {
              type: 'keyword',
              value: 'oblique',
            },
          },
          variant: {
            type: 'keyword',
            value: 'small-caps',
          },
          weight: { type: 'keyword', value: 'invalidValue' },
        },
      }),
    )
  })

  test('Single properties overides the shorthand property', () => {
    expect(
      parseCss({
        style: {
          font: 'oblique 45deg small-caps bold condensed 16px/2 cursive',
          'font-style': 'italic',
          'font-stretch': 'extra-condensed',
          'font-weight': '400',
          'font-size': '12px',
          'line-height': '14px',
          'font-family': 'Fira Sans',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'string',
              value: 'Fira Sans',
              quote: '"',
            },
          ],
          size: {
            type: 'length',
            value: '12',
            unit: 'px',
          },
          lineHeight: {
            type: 'length',
            value: '14',
            unit: 'px',
          },
          stretch: {
            type: 'keyword',
            value: 'extra-condensed',
          },
          style: {
            style: {
              type: 'keyword',
              value: 'italic',
            },
          },
          variant: {
            type: 'keyword',
            value: 'small-caps',
          },
          weight: {
            type: 'number',
            value: '400',
          },
        },
      }),
    )
  })

  test('Single properties not overides the shorthand property', () => {
    expect(
      parseCss({
        style: {
          'font-style': 'italic',
          'font-stretch': 'extra-condensed',
          'font-weight': '400',
          'font-size': '12px',
          'line-height': '14px',
          'font-family': 'Fira Sans',
          font: 'oblique 45deg small-caps bold condensed 16px/2 cursive',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'keyword',
              value: 'cursive',
            },
          ],
          size: {
            type: 'length',
            value: '16',
            unit: 'px',
          },
          lineHeight: {
            type: 'number',
            value: '2',
          },
          stretch: {
            type: 'keyword',
            value: 'condensed',
          },
          style: {
            angle: { type: 'angle', value: '45', unit: 'deg' },
            style: {
              type: 'keyword',
              value: 'oblique',
            },
          },
          variant: {
            type: 'keyword',
            value: 'small-caps',
          },
          weight: {
            type: 'keyword',
            value: 'bold',
          },
        },
      }),
    )
  })

  test('Single properties overides the invalid shorthand property', () => {
    expect(
      parseCss({
        style: {
          'font-style': 'italic',
          'font-stretch': 'extra-condensed',
          'font-weight': '400',
          'font-size': '12px',
          'line-height': '14px',
          'font-family': 'Fira Sans',
          font: 'oblique 45deg small-caps jhghjhj condensed 16px/2 cursive',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'string',
              value: 'Fira Sans',
              quote: '"',
            },
          ],
          size: {
            type: 'length',
            value: '12',
            unit: 'px',
          },
          lineHeight: {
            type: 'length',
            value: '14',
            unit: 'px',
          },
          stretch: {
            type: 'keyword',
            value: 'extra-condensed',
          },
          style: {
            style: {
              type: 'keyword',
              value: 'italic',
            },
          },
          weight: {
            type: 'number',
            value: '400',
          },
        },
      }),
    )
  })

  test('Single properties font-family defined', () => {
    expect(
      parseCss({
        style: {
          'font-family': 'Fira Sans',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        font: {
          family: [
            {
              type: 'string',
              value: 'Fira Sans',
              quote: '"',
            },
          ],
        },
      }),
    )
  })
})
