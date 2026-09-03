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

  test('Parses basic transition properties correctly when using a variable', () => {
    expect(
      (
        parseCss({
          style: {
            transition: 'color var(--duration) linear',
          },
          variables: {
            spacing: [
              {
                description: '',
                inherits: true,
                initialValue: null,
                name: '--duration',
                syntax: { name: 'time', type: 'primitive' },
                value: '100ms',
              } as any,
            ],
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'function',
          name: 'var',
          value: '--duration',
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

  test('Parses basic transition properties correctly when using a variable that reference a variable', () => {
    expect(
      (
        parseCss({
          style: {
            transition: 'color var(--duration-2) linear',
          },
          variables: {
            spacing: [
              {
                name: 'duration-1',
                type: 'value',
                value: '0.4s',
                category: 'spacing',
              },
              {
                description: '',
                inherits: true,
                initialValue: null,
                name: '--duration-2',
                syntax: { name: 'time', type: 'primitive' },
                value: 'var(--duration-1)',
              } as any,
            ],
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'function',
          name: 'var',
          value: '--duration-2',
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

  test('Parses transition when single properties are also defined', () => {
    expect(
      (
        parseCss({
          style: {
            transition:
              'color 2ms 1s cubic-bezier(0.4, 0, 0.2, 1), color 300ms ease',
            'transition-timing-function':
              'cubic-bezier(0.4, 0, 0.2, 1), cubic-bezier(0.4, 0, 0.2, 2)',
            'transition-duration': '3ms, 5ms',
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'time',
          unit: 'ms',
          value: '3',
        },
        delay: {
          type: 'time',
          unit: 's',
          value: '1',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'function',
          name: 'cubic-bezier',
          value: '0.4, 0, 0.2, 1',
        },
      },
      {
        duration: {
          type: 'time',
          unit: 'ms',
          value: '5',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'function',
          name: 'cubic-bezier',
          value: '0.4, 0, 0.2, 2',
        },
      },
    ])
  })
  test('Parses transition when single properties are defined first', () => {
    expect(
      (
        parseCss({
          style: {
            'transition-timing-function':
              'cubic-bezier(0.4, 0, 0.2, 1), cubic-bezier(0.4, 0, 0.2, 2)',
            'transition-duration': '3ms, 5ms',
            transition:
              'color 2ms 1s cubic-bezier(0.4, 0, 0.2, 1), color 300ms ease',
          },
        }) as any
      ).transition,
    ).toEqual([
      {
        duration: {
          type: 'time',
          unit: 'ms',
          value: '2',
        },
        delay: {
          type: 'time',
          unit: 's',
          value: '1',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'function',
          name: 'cubic-bezier',
          value: '0.4, 0, 0.2, 1',
        },
      },
      {
        duration: {
          type: 'time',
          unit: 'ms',
          value: '300',
        },
        property: {
          type: 'keyword',
          value: 'color',
        },
        timing: {
          type: 'keyword',
          value: 'ease',
        },
      },
    ])
  })
})
