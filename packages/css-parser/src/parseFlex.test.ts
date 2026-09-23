import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('parseFlex', () => {
  test('Flex, shrink and basis are defined', () => {
    expect(
      parseCss({
        style: {
          flex: '2 4 5px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '2',
          },
          shrink: {
            type: 'number',
            value: '4',
          },
          basis: {
            type: 'length',
            value: '5',
            unit: 'px',
          },
        },
      }),
    )
  })
  test('Flex, shrink and basis are defined and basis has a 0 value', () => {
    expect(
      parseCss({
        style: {
          flex: '1 1 0',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'number',
            value: '1',
          },
          basis: {
            type: 'number',
            value: '0',
          },
        },
      }),
    )
  })
  test('Only grow is defined', () => {
    expect(
      parseCss({
        style: {
          flex: '5',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '5',
          },
          shrink: {
            type: 'number',
            value: '1',
          },
          basis: {
            type: 'length',
            value: '0',
            unit: '%',
          },
        },
      }),
    )
  })

  test('Only basis is defined', () => {
    expect(
      parseCss({
        style: {
          flex: '5px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'number',
            value: '1',
          },
          basis: {
            type: 'length',
            value: '5',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Grow and shrink are defined', () => {
    expect(
      parseCss({
        style: {
          flex: '5 3',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '5',
          },
          shrink: {
            type: 'number',
            value: '3',
          },
          basis: {
            type: 'length',
            value: '0',
            unit: '%',
          },
        },
      }),
    )
  })

  test('Grow and basis are defined', () => {
    expect(
      parseCss({
        style: {
          flex: '5 3px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '5',
          },
          shrink: {
            type: 'number',
            value: '1',
          },
          basis: {
            type: 'length',
            value: '3',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Return the defined variables', () => {
    expect(
      parseCss({
        style: {
          flex: '1 var(--shrink) 3px',
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
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'function',
            name: 'var',
            value: '--shrink',
          },
          basis: {
            type: 'length',
            value: '3',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('If undefined variables return the values in order -- grow shrink basis --', () => {
    expect(
      parseCss({
        style: {
          flex: '1 var(--shr) 3px',
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
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'function',
            name: 'var',
            value: '--shr',
          },
          basis: {
            type: 'length',
            value: '3',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Return the invalid values', () => {
    expect(
      parseCss({
        style: {
          flex: '1 invVal 3px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'keyword',
            value: 'invVal',
          },
          basis: {
            type: 'length',
            value: '3',
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
          flex: '1 2 3px',
          'flex-grow': '3',
          'flex-basis': '5px',
          'flex-shrink': 'invalid',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '3',
          },
          shrink: {
            type: 'number',
            value: '2',
          },
          basis: {
            type: 'length',
            value: '5',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Single properties not overides the shorthand property', () => {
    expect(
      parseCss({
        style: {
          'flex-grow': '3',
          'flex-basis': '5px',
          'flex-shrink': 'invalid',
          flex: '1 2 3px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '1',
          },
          shrink: {
            type: 'number',
            value: '2',
          },
          basis: {
            type: 'length',
            value: '3',
            unit: 'px',
          },
        },
      }),
    )
  })

  test('Single properties overides the invalid shorthand property', () => {
    expect(
      parseCss({
        style: {
          'flex-grow': '3',
          'flex-basis': '5px',
          'flex-shrink': 'invalid',
          flex: 'invalid 2 3px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        flex: {
          grow: {
            type: 'number',
            value: '3',
          },
          basis: {
            type: 'length',
            value: '5',
            unit: 'px',
          },
        },
      }),
    )
  })
})
