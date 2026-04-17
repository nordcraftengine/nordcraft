import { describe, expect, test } from 'bun:test'
import { parseCss } from './cssParser'

describe('parseTransitions', () => {
  test('Parses basic transition properties correctly', () => {
    expect(
      (
        parseCss({
          style: {
            transition: 'color 0.3s linear',
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'time',
          unit: 's',
          value: '0.3',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
      },
    ])
  })

  test('Parses transition properties correctly when using complex timing functions', () => {
    expect(
      (
        parseCss({
          style: {
            transition:
              'color 0.3s linear(0 0%, 1 27.9%, 0.7 38.8%, 1 56.5%, 0.9 63.5%, 1 75.7%, 0.9 83.3%, 1 100% /*{"type":"spring","stiffness":100,"damping":20,"mass":6}*/)',
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'time',
          unit: 's',
          value: '0.3',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'function',
          name: 'linear',
          value:
            '0 0%, 1 27.9%, 0.7 38.8%, 1 56.5%, 0.9 63.5%, 1 75.7%, 0.9 83.3%, 1 100% /*{"type":"spring","stiffness":100,"damping":20,"mass":6}*/',
        },
      },
    ])
  })
})
