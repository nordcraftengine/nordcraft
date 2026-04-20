import { describe, expect, test } from 'bun:test'

import { getParsedBoxShadow } from './parseBoxShadow'

describe('parseBoxShadow', () => {
  test('One box shadow is defined', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': 'red 12px 13px 2px 1px inset',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'length', value: '12', unit: 'px' },
        vertical: { type: 'length', value: '13', unit: 'px' },
        blur: { type: 'length', value: '2', unit: 'px' },
        spread: { type: 'length', value: '1', unit: 'px' },
        position: { type: 'keyword', value: 'inset' },
        color: { type: 'keyword', value: 'red' },
      },
    ])
  })

  test('Multiple box shadows are defined', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': '1px 2px 3px, 0 0 1em, 0 0 0.2em',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'length', value: '1', unit: 'px' },
        vertical: { type: 'length', value: '2', unit: 'px' },
        blur: { type: 'length', value: '3', unit: 'px' },
      },
      {
        horizontal: { type: 'number', value: '0' },
        vertical: { type: 'number', value: '0' },
        blur: { type: 'length', value: '1', unit: 'em' },
      },
      {
        horizontal: { type: 'number', value: '0' },
        vertical: { type: 'number', value: '0' },
        blur: { type: 'length', value: '0.2', unit: 'em' },
      },
    ])
  })

  test('One box shadow with horizontal and vertical values is defined', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': '1px 2px',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'length', value: '1', unit: 'px' },
        vertical: { type: 'length', value: '2', unit: 'px' },
      },
    ])
  })

  test('Box shadow set to none', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': 'none',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: {
          type: 'keyword',
          value: 'none',
        },
      },
    ])
  })

  test('Use defined variable as horizontal value', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': 'var(--horizontal) 2px 4px',
        },
        [
          {
            name: 'horizontal',
            type: 'value',
            value: '5px',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual([
      {
        horizontal: { type: 'function', name: 'var', value: '--horizontal' },
        vertical: { type: 'length', value: '2', unit: 'px' },
        blur: { type: 'length', value: '4', unit: 'px' },
      },
    ])
  })

  test('If undefined variables return the values in order', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': 'var(--horizontal) 2px 4px',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'function', name: 'var', value: '--horizontal' },
        vertical: { type: 'length', value: '2', unit: 'px' },
        blur: { type: 'length', value: '4', unit: 'px' },
      },
    ])
  })

  test('Return the invalid values', () => {
    expect(
      getParsedBoxShadow(
        {
          'box-shadow': '1px invalidVal 4px',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'length', value: '1', unit: 'px' },
        vertical: { type: 'length', value: '4', unit: 'px' },
        blur: { type: 'keyword', value: 'invalidVal' },
      },
    ])
  })
})
