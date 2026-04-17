import { describe, expect, test } from 'bun:test'
import { getParsedBorder } from './parseBorder'

describe('parseBorder', () => {
  test('The border shorthand property is defined', () => {
    expect(
      getParsedBorder(
        {
          border: '2px solid grey',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '2',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'grey' },
      },
    })
  })

  test('Only style is defined', () => {
    expect(
      getParsedBorder(
        {
          border: 'dashed',
        },
        [],
      ),
    ).toEqual({
      all: {
        style: {
          type: 'keyword',
          value: 'dashed',
        },
      },
    })
  })

  test('Use defined variable as width', () => {
    expect(
      getParsedBorder(
        {
          border: 'var(--width) dashed',
        },
        [
          {
            name: 'width',
            type: 'value',
            value: '5px',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
      },
    })
  })

  test('If undefined variables return the values in order', () => {
    expect(
      getParsedBorder(
        {
          border: 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })

  test('Return the invalid values', () => {
    expect(
      getParsedBorder(
        {
          border: '3px invalidVal red',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '3',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'invalidVal',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })

  test('Single properties overides the shorthand property', () => {
    expect(
      getParsedBorder(
        {
          border: '3px solid black',
          'border-width': '4px',
          'border-style': 'dotted',
          'border-color': 'pink',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '4',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dotted',
        },
        color: { type: 'keyword', value: 'pink' },
      },
    })
  })

  test('Single properties not overides the shorthand property', () => {
    expect(
      getParsedBorder(
        {
          'border-width': '4px',
          'border-style': 'dotted',
          'border-color': 'pink',
          border: '3px solid black',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '3',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'black' },
      },
    })
  })

  test('Single properties overides the invalid shorthand property', () => {
    expect(
      getParsedBorder(
        {
          'border-width': '4px',
          'border-style': 'dotted',
          'border-color': 'pink',
          border: '3px invalid',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '4',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dotted',
        },
        color: { type: 'keyword', value: 'pink' },
      },
    })
  })

  test('Single properties defined', () => {
    expect(
      getParsedBorder(
        {
          'border-width': '5px',
          'border-style': 'dashed',
          'border-color': 'red',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '5',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('Border left is set', () => {
    expect(
      getParsedBorder(
        {
          'border-left': '5px solid red',
        },
        [],
      ),
    ).toEqual({
      left: {
        width: {
          type: 'length',
          value: '5',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('Border right is set', () => {
    expect(
      getParsedBorder(
        {
          'border-right': '5px solid red',
        },
        [],
      ),
    ).toEqual({
      right: {
        width: {
          type: 'length',
          value: '5',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('Border top is set', () => {
    expect(
      getParsedBorder(
        {
          'border-top': '5px solid red',
        },
        [],
      ),
    ).toEqual({
      top: {
        width: {
          type: 'length',
          value: '5',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('Border bottom is set', () => {
    expect(
      getParsedBorder(
        {
          'border-bottom': '5px solid red',
        },
        [],
      ),
    ).toEqual({
      bottom: {
        width: {
          type: 'length',
          value: '5',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('Single properties overrides the shorthand property', () => {
    expect(
      getParsedBorder(
        {
          'border-left': '5px solid',
          'border-left-width': '10px',
          'border-left-style': 'dashed',
          'border-left-color': 'red',
          'border-right': '2px solid',
          'border-right-width': '3px',
          'border-right-style': 'dotted',
          'border-right-color': 'red',
          'border-top': '1px dashed',
          'border-top-width': '2px',
          'border-top-style': 'solid',
          'border-top-color': 'red',
          'border-bottom': '8px dotted',
          'border-bottom-width': '9px',
          'border-bottom-style': 'dashed',
          'border-bottom-color': 'red',
        },
        [],
      ),
    ).toEqual({
      left: {
        width: {
          type: 'length',
          value: '10',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: { type: 'keyword', value: 'red' },
      },
      right: {
        width: {
          type: 'length',
          value: '3',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dotted',
        },
        color: { type: 'keyword', value: 'red' },
      },
      top: {
        width: {
          type: 'length',
          value: '2',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: { type: 'keyword', value: 'red' },
      },
      bottom: {
        width: {
          type: 'length',
          value: '9',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: { type: 'keyword', value: 'red' },
      },
    })
  })

  test('If undefined variables for border-left return the values in order', () => {
    expect(
      getParsedBorder(
        {
          'border-left': 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
      left: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })
  test('If undefined variables for border-right return the values in order', () => {
    expect(
      getParsedBorder(
        {
          'border-right': 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
      right: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })
  test('If undefined variables for border-top return the values in order', () => {
    expect(
      getParsedBorder(
        {
          'border-top': 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
      top: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })
  test('If undefined variables for border-bottom return the values in order', () => {
    expect(
      getParsedBorder(
        {
          'border-bottom': 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
      bottom: {
        width: {
          type: 'function',
          name: 'var',
          value: '--width',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'keyword',
          value: 'red',
        },
      },
    })
  })

  test('handles oklch color in border shorthand', () => {
    expect(
      getParsedBorder(
        {
          border: '1px solid oklch(0.7 0.1 200)',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '1',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'solid',
        },
        color: {
          type: 'function',
          name: 'oklch',
          value: '0.7 0.1 200',
        },
      },
    })
  })

  test('handles color-mix in border shorthand', () => {
    expect(
      getParsedBorder(
        {
          border: '2px dashed color-mix(in srgb, red, blue)',
        },
        [],
      ),
    ).toEqual({
      all: {
        width: {
          type: 'length',
          value: '2',
          unit: 'px',
        },
        style: {
          type: 'keyword',
          value: 'dashed',
        },
        color: {
          type: 'function',
          name: 'color-mix',
          value: 'in srgb, red, blue',
        },
      },
    })
  })
})
