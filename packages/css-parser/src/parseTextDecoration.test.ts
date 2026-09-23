import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('parseTextDecoration', () => {
  test('All the properties are defined with the shorthand', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'underline wavy 6px #d74109',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: { type: 'hex', value: '#d74109' },
          line: [
            {
              type: 'keyword',
              value: 'underline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'wavy',
          },
          thickness: {
            type: 'length',
            unit: 'px',
            value: '6',
          },
        },
      }),
    )
  })
  test('Only line is defined', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'underline',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          line: [
            {
              type: 'keyword',
              value: 'underline',
            },
          ],
        },
      }),
    )
  })

  test('Return the defined variables', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'underline wavy var(--thickness)',
        },
        variables: {
          spacing: [
            {
              name: 'thickness',
              type: 'value',
              value: '2px',
              category: 'spacing',
            },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          line: [
            {
              type: 'keyword',
              value: 'underline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'wavy',
          },
          thickness: {
            type: 'function',
            name: 'var',
            value: '--thickness',
          },
        },
      }),
    )
  })

  test('If undefined variables return the values in order -- line style color thickness --', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'overline dashed red var(--some)',
        },
        variables: {
          spacing: [
            {
              name: 'shrink',
              type: 'value',
              value: '2',
              category: 'spacing',
            },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: { type: 'keyword', value: 'red' },
          line: [
            {
              type: 'keyword',
              value: 'overline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'dashed',
          },
          thickness: {
            type: 'function',
            name: 'var',
            value: '--some',
          },
        },
      }),
    )
  })

  test('Return the invalid values', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'overline dashed 4px invalidValue ',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: { type: 'keyword', value: 'invalidValue' },
          line: [
            {
              type: 'keyword',
              value: 'overline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'dashed',
          },
          thickness: {
            type: 'length',
            value: '4',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Single properties overides the shorthand property', () => {
    expect(
      parseCss({
        style: {
          'text-decoration': 'underline wavy 6px pink',
          'text-decoration-line': 'overline',
          'text-decoration-style': 'dotted',
          'text-decoration-thickness': '3px',
          'text-decoration-color': 'red',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: {
            type: 'keyword',
            value: 'red',
          },
          line: [
            {
              type: 'keyword',
              value: 'overline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'dotted',
          },
          thickness: {
            type: 'length',
            unit: 'px',
            value: '3',
          },
        },
      }),
    )
  })

  test('Single properties not overides the shorthand property', () => {
    expect(
      parseCss({
        style: {
          'text-decoration-line': 'overline',
          'text-decoration-style': 'dotted',
          'text-decoration-thickness': '3px',
          'text-decoration-color': 'red',
          'text-decoration': 'underline wavy 6px pink',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: {
            type: 'keyword',
            value: 'pink',
          },
          line: [
            {
              type: 'keyword',
              value: 'underline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'wavy',
          },
          thickness: {
            type: 'length',
            unit: 'px',
            value: '6',
          },
        },
      }),
    )
  })

  test('Single properties overides the invalid shorthand property', () => {
    expect(
      parseCss({
        style: {
          'text-decoration-line': 'overline',
          'text-decoration-style': 'dotted',
          'text-decoration-thickness': '3px',
          'text-decoration-color': 'red',
          'text-decoration': 'invalid wavy 6px green',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        textDecoration: {
          color: {
            type: 'keyword',
            value: 'red',
          },
          line: [
            {
              type: 'keyword',
              value: 'overline',
            },
          ],
          style: {
            type: 'keyword',
            value: 'dotted',
          },
          thickness: {
            type: 'length',
            unit: 'px',
            value: '3',
          },
        },
      }),
    )
  })
})
