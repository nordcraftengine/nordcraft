import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('parseBorderRadius', () => {
  test('It returns the invalid value', () => {
    expect(
      parseCss({
        style: {
          color: 'hotpink',

          'border-radius': '2',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        borderRadius: {
          topLeft: {
            horizontal: {
              type: 'number',
              value: '2',
            },
          },
          topRight: {
            horizontal: {
              type: 'number',
              value: '2',
            },
          },
          bottomLeft: {
            horizontal: {
              type: 'number',
              value: '2',
            },
          },
          bottomRight: {
            horizontal: {
              type: 'number',
              value: '2',
            },
          },
        },
      }),
    )
  })
  test('It returns the valid value', () => {
    expect(
      parseCss({
        style: {
          color: 'hotpink',
          'border-radius': '5px',
        },
        variables: {},
      }),
    ).toEqual(
      expect.objectContaining({
        borderRadius: {
          topLeft: {
            horizontal: {
              type: 'length',
              value: '5',
              unit: 'px',
            },
          },
          topRight: {
            horizontal: {
              type: 'length',
              value: '5',
              unit: 'px',
            },
          },
          bottomLeft: {
            horizontal: {
              type: 'length',
              value: '5',
              unit: 'px',
            },
          },
          bottomRight: {
            horizontal: {
              type: 'length',
              value: '5',
              unit: 'px',
            },
          },
        },
      }),
    )
  })
})
