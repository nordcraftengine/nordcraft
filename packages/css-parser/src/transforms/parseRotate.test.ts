import { describe, expect, test } from 'bun:test'
import { getParsedRotate } from './parseRotate'

describe('getParsedRotate', () => {
  describe('no rotate', () => {
    test('returns null', () => {
      expect(getParsedRotate({}, [])).toEqual(null)
    })
  })

  describe('keyword values', () => {
    test('parses none', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'none',
          },
          [],
        ),
      ).toEqual({
        type: 'keyword',
        value: 'none',
      })
    })
  })

  describe('angle value', () => {
    test('parses value', () => {
      expect(
        getParsedRotate(
          {
            rotate: '90deg',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '90', unit: 'deg' },
        z: { type: 'number', value: '1' },
      })
    })

    test('parses variable', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'var(--variable)',
          },
          [
            {
              name: 'variable',
              type: 'value',
              value: '90deg',
              category: 'spacing',
            },
          ],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'function', name: 'var', value: '--variable' },
        z: { type: 'number', value: '1' },
      })
    })
  })

  describe('x, y, or z axis name plus angle', () => {
    test('parses x values', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'x 90deg',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '90', unit: 'deg' },
        x: { type: 'number', value: '1' },
      })
    })

    test('parses y values', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'y 0.25turn',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '0.25', unit: 'turn' },
        y: { type: 'number', value: '1' },
      })
    })

    test('parses z values inverted', () => {
      expect(
        getParsedRotate(
          {
            rotate: '1.57rad z',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '1.57', unit: 'rad' },
        z: { type: 'number', value: '1' },
      })
    })

    test('parses value and variable', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'x var(--variable)',
          },
          [
            {
              name: 'variable',
              type: 'value',
              value: '90deg',
              category: 'spacing',
            },
          ],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'function', value: '--variable', name: 'var' },
        x: { type: 'number', value: '1' },
      })
    })

    test('parses double variables', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'var(--variable) var(--axis)',
          },
          [
            {
              name: 'axis',
              type: 'value',
              value: 'x',
              category: 'spacing',
            },
            {
              name: 'variable',
              type: 'value',
              value: '90deg',
              category: 'spacing',
            },
          ],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'function', value: '--variable', name: 'var' },
        x: { type: 'number', value: '1' },
      })
    })

    test('does not parse unknown axis variables', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'var(--non-existing-variable) var(--axis)',
          },
          [
            {
              name: 'variable',
              type: 'value',
              value: '90deg',
              category: 'spacing',
            },
          ],
        ),
      ).toEqual(null)
    })

    test('parses nonsense', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'a 90deg',
          },
          [],
        ),
      ).toEqual(null)
    })
  })

  describe('vector plus angle value', () => {
    test('parses value', () => {
      expect(
        getParsedRotate(
          {
            rotate: '1 0 1 90deg',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '90', unit: 'deg' },
        z: { type: 'number', value: '1' },
        x: { type: 'number', value: '1' },
        y: { type: 'number', value: '0' },
      })
    })

    test('parses value inverted', () => {
      expect(
        getParsedRotate(
          {
            rotate: '90deg 1 0 1',
          },
          [],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'angle', value: '90', unit: 'deg' },
        z: { type: 'number', value: '1' },
        x: { type: 'number', value: '1' },
        y: { type: 'number', value: '0' },
      })
    })

    test('parses values and variables', () => {
      expect(
        getParsedRotate(
          {
            rotate: '0 2 1.2 var(--variable)',
          },
          [
            {
              name: 'variable',
              type: 'value',
              value: '1.57rad',
              category: 'spacing',
            },
          ],
        ),
      ).toEqual({
        type: 'axis',
        angle: { type: 'function', value: '--variable', name: 'var' },
        z: { type: 'number', value: '1.2' },
        x: { type: 'number', value: '0' },
        y: { type: 'number', value: '2' },
      })
    })
  })

  describe('global values', () => {
    test('parses value', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'inherit',
          },
          [],
        ),
      ).toEqual({
        type: 'keyword',
        value: 'inherit',
      })
    })
  })

  describe('nonsense', () => {
    test('parses nonsense', () => {
      expect(
        getParsedRotate(
          {
            rotate: 'nonsense',
          },
          [],
        ),
      ).toEqual({
        type: 'keyword',
        value: 'nonsense',
      })
    })
  })
})
