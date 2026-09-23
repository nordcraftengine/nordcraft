import { describe, expect, test } from 'bun:test'
import { parseTransform } from './parseTransform'

describe('parseTransform', () => {
  describe('no transform', () => {
    test('returns empty default', () => {
      expect(parseTransform({})).toEqual({
        all: [],
        transformOrigin: { x: null, y: null, z: null },
        transformStyle: null,
        transformBox: null,
      })
    })
  })

  describe('single transform', () => {
    test('returns parsed value', () => {
      expect(parseTransform({ transform: 'rotate3d(1 0 1 90deg)' })).toEqual({
        all: [
          {
            rotate3d: {
              x: { type: 'number', value: '1' },
              y: { type: 'number', value: '0' },
              z: { type: 'number', value: '1' },
              angle: { type: 'angle', value: '90', unit: 'deg' },
            },
          },
        ],
        transformOrigin: { x: null, y: null, z: null },
        transformStyle: null,
        transformBox: null,
      })
    })
  })

  describe('multiple transforms', () => {
    test('returns parsed value in order', () => {
      expect(
        parseTransform({
          transform: 'rotate3d(1 0 1 90deg) scale(1.1) rotate(45deg)',
        }),
      ).toEqual({
        all: [
          {
            rotate3d: {
              x: { type: 'number', value: '1' },
              y: { type: 'number', value: '0' },
              z: { type: 'number', value: '1' },
              angle: { type: 'angle', value: '90', unit: 'deg' },
            },
          },
          {
            scale: {
              x: { type: 'number', value: '1.1' },
              y: { type: 'number', value: '1.1' },
            },
          },
          {
            rotate: {
              angle: { type: 'angle', value: '45', unit: 'deg' },
            },
          },
        ],
        transformOrigin: { x: null, y: null, z: null },
        transformStyle: null,
        transformBox: null,
      })
    })
  })
})
