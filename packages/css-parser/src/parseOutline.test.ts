import { describe, expect, test } from 'bun:test'
import { getParsedOutline } from './parseOutline'

describe('parseOutline', () => {
  test('The outline shorthand property is defined', () => {
    expect(
      getParsedOutline(
        {
          outline: '2px red solid',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '2',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'solid',
      },
      color: {
        type: 'keyword',
        value: 'red',
      },
    })
  })

  test('Only style and width are defined', () => {
    expect(
      getParsedOutline(
        {
          outline: '2px solid',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '2',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'solid',
      },
    })
  })

  test('Only style is defined', () => {
    expect(
      getParsedOutline(
        {
          outline: 'solid',
        },
        [],
      ),
    ).toEqual({
      style: {
        type: 'keyword',
        value: 'solid',
      },
    })
  })

  test('Use defined variable as width', () => {
    expect(
      getParsedOutline(
        {
          outline: 'var(--width) dashed red',
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
    })
  })

  test('If undefined variables return the values in order', () => {
    expect(
      getParsedOutline(
        {
          outline: 'var(--width) dashed red',
        },
        [],
      ),
    ).toEqual({
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
    })
  })

  test('Return the invalid values', () => {
    expect(
      getParsedOutline(
        {
          outline: '3px invalidVal red',
        },
        [],
      ),
    ).toEqual({
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
    })
  })

  test('Single properties overides the shorthand property', () => {
    expect(
      getParsedOutline(
        {
          outline: '3px solid',
          'outline-width': '4px',
          'outline-style': 'dotted',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '4',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'dotted',
      },
    })
  })

  test('Single properties not overides the shorthand property', () => {
    expect(
      getParsedOutline(
        {
          'outline-width': '4px',
          'outline-style': 'dotted',
          outline: '3px solid',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '3',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'solid',
      },
    })
  })

  test('Single properties overides the invalid shorthand property', () => {
    expect(
      getParsedOutline(
        {
          'outline-width': '4px',
          'outline-style': 'dotted',
          outline: '3px invalid',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '4',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'dotted',
      },
    })
  })

  test('Single properties defined', () => {
    expect(
      getParsedOutline(
        {
          'outline-width': '5px',
          'outline-style': 'dashed',
        },
        [],
      ),
    ).toEqual({
      width: {
        type: 'length',
        value: '5',
        unit: 'px',
      },
      style: {
        type: 'keyword',
        value: 'dashed',
      },
    })
  })

  test('handles oklch color in outline shorthand', () => {
    expect(
      getParsedOutline(
        {
          outline: '1px solid oklch(0.7 0.1 200)',
        },
        [],
      ),
    ).toEqual({
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
    })
  })
})
