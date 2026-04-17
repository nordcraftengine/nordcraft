import { describe, expect, test } from 'bun:test'

import { getParsedTextShadow } from './parseTextShadow'

describe('parseTextShadow', () => {
  test('One text shadow is defined', () => {
    expect(
      getParsedTextShadow(
        {
          'text-shadow': '1px 2px 3px #ffffff',
        },
        [],
      ),
    ).toEqual([
      {
        horizontal: { type: 'length', value: '1', unit: 'px' },
        vertical: { type: 'length', value: '2', unit: 'px' },
        blur: { type: 'length', value: '3', unit: 'px' },
        color: { type: 'hex', value: '#ffffff' },
      },
    ])
  })

  test('Multiple text shadows are defined', () => {
    expect(
      getParsedTextShadow(
        {
          'text-shadow': '  1px 2px 3px, 0 0 1em, 0 0 0.2em',
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

  test('One text shadow with horizontal and vertical values is defined', () => {
    expect(
      getParsedTextShadow(
        {
          'text-shadow': '1px 2px',
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

  test('Text shadow set to none', () => {
    expect(
      getParsedTextShadow(
        {
          'text-shadow': 'none',
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
      getParsedTextShadow(
        {
          'text-shadow': 'var(--horizontal) 2px 4px',
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
      getParsedTextShadow(
        {
          'text-shadow': 'var(--horizontal) 2px 4px',
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
      getParsedTextShadow(
        {
          'text-shadow': '1px invalidVal 4px',
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
