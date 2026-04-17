import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('cssParser', () => {
  test('padding', () => {
    expect(
      parseCss({
        style: {
          color: 'hotpink',
          'padding-left': '8px',
          'border-radius': '2',
          'padding-right': '8px',
          'background-color': 'var(--red-500, #EF4444)',
          'padding-top': '4px',
          'padding-bottom': '4px',
        },
        variables: {
          color: [
            {
              name: 'red-50',
              type: 'value',
              value: '#FEF2F2',
              category: 'color',
            },
            {
              name: 'red-100',
              type: 'value',
              value: '#FEE2E2',
              category: 'color',
            },
          ],
          shadow: [
            {
              name: 'shadow-sm',
              type: 'value',
              value: ' 0 1px 2px 0 rgba(0, 0, 0, 0.25)',
              category: 'shadow',
            },
            {
              name: 'shadow-base',
              type: 'value',
              value:
                ' 0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px 0 rgba(0, 0, 0, 0.25)',
              category: 'shadow',
            },
          ],
          'font-size': [
            {
              name: 'font-size-xxs',
              type: 'value',
              value: '0.625rem',
              category: 'font-size',
            },
            {
              name: 'font-size-xs',
              type: 'value',
              value: '0.75rem',
              category: 'font-size',
            },
          ],
          'font-weight': [
            {
              name: 'font-weight-thin',
              type: 'value',
              value: '100',
              category: 'font-weight',
            },
            {
              name: 'font-weight-lighter',
              type: 'value',
              value: '200',
              category: 'font-weight',
            },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        padding: {
          bottom: {
            type: 'length',
            unit: 'px',
            value: '4',
          },
          left: {
            type: 'length',
            unit: 'px',
            value: '8',
          },
          right: {
            type: 'length',
            unit: 'px',
            value: '8',
          },
          top: {
            type: 'length',
            unit: 'px',
            value: '4',
          },
        },
      }),
    )
  })
})
