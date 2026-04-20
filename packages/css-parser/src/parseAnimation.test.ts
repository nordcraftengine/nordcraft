import { describe, expect, test } from 'bun:test'
import { getParsedAnimation } from './parseAnimation'

describe('parseAnimation', () => {
  test('The animation shorthand with all properties is defined', () => {
    expect(
      getParsedAnimation(
        {
          animation:
            '0.5s linear 1s infinite alternate running forwards slide-in',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '0.5',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '1',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        playState: {
          type: 'keyword',
          value: 'running',
        },
        fillMode: {
          type: 'keyword',
          value: 'forwards',
        },
        name: {
          type: 'keyword',
          value: 'slide-in',
        },
      },
    ])
  })

  test('Multiple animations are defined', () => {
    expect(
      getParsedAnimation(
        {
          animation:
            '0.5s linear 1s infinite alternate running forwards slide-in, 4s linear 0s infinite alternate sun-rise',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '0.5',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '1',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        playState: {
          type: 'keyword',
          value: 'running',
        },
        fillMode: {
          type: 'keyword',
          value: 'forwards',
        },
        name: {
          type: 'keyword',
          value: 'slide-in',
        },
      },
      {
        duration: {
          type: 'time',
          value: '4',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('Use defined variable as duration', () => {
    expect(
      getParsedAnimation(
        {
          animation: 'var(--duration) linear 0s infinite alternate sun-rise',
        },
        [
          {
            name: 'duration',
            type: 'value',
            value: '5s',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual([
      {
        duration: {
          type: 'function',
          name: 'var',
          value: '--duration',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('If undefined variable return in order', () => {
    expect(
      getParsedAnimation(
        {
          animation: 'var(--duration) linear 0s 2 alternate sun-rise',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'function',
          name: 'var',
          value: '--duration',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        iterationCount: {
          type: 'number',
          value: '2',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        fillMode: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('Return the invalid value', () => {
    expect(
      getParsedAnimation(
        {
          animation: '4s linear 0s 2 invalidVal sun-rise',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '4',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        iterationCount: {
          type: 'number',
          value: '2',
        },
        name: {
          type: 'keyword',
          value: 'invalidVal',
        },
        direction: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('Single properties should override the shorthand property', () => {
    expect(
      getParsedAnimation(
        {
          animation: '4s linear 0s infinite alternate sun-rise',
          'animation-duration': '5s',
          'animation-timing-function': 'ease',
          'animation-delay': '2s',
          'animation-iteration-count': '15',
          'animation-direction': 'reverse',
          'animation-name': 'newName',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '5',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'ease',
        },
        delay: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'reverse',
        },
        iterationCount: {
          type: 'number',
          value: '15',
        },
        name: {
          type: 'keyword',
          value: 'newName',
        },
      },
    ])
  })

  test('Single properties should not override the shorthand property', () => {
    expect(
      getParsedAnimation(
        {
          'animation-duration': '5s',
          'animation-timing-function': 'ease',
          'animation-delay': '2s',
          'animation-iteration-count': '15',
          'animation-direction': 'reverse',
          'animation-name': 'newName',
          animation: '4s linear 0s infinite alternate sun-rise',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '4',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'linear',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('Single properties should override the invalid shorthand property', () => {
    expect(
      getParsedAnimation(
        {
          'animation-duration': '5s',
          'animation-timing-function': 'ease',
          'animation-delay': '2s',
          'animation-iteration-count': '15',
          'animation-direction': 'reverse',
          'animation-name': 'newName',
          animation: '4s linear 0s infinite alternate sun-rise invalidValue',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '5',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'ease',
        },
        delay: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'reverse',
        },
        iterationCount: {
          type: 'number',
          value: '15',
        },
        name: {
          type: 'keyword',
          value: 'newName',
        },
      },
    ])
  })

  test('Single properties defined', () => {
    expect(
      getParsedAnimation(
        {
          'animation-duration': '5s',
          'animation-timing-function': 'ease',
          'animation-delay': '2s',
          'animation-iteration-count': '15',
          'animation-direction': 'reverse',
          'animation-name': 'newName',
          'animation-fill-mode': 'backwards',
          'animation-play-state': 'paused',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '5',
          unit: 's',
        },
        timing: {
          type: 'keyword',
          value: 'ease',
        },
        delay: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'reverse',
        },
        iterationCount: {
          type: 'number',
          value: '15',
        },
        name: {
          type: 'keyword',
          value: 'newName',
        },
        fillMode: {
          type: 'keyword',
          value: 'backwards',
        },
        playState: {
          type: 'keyword',
          value: 'paused',
        },
      },
    ])
  })

  test('Complex timing function, such as cubic-bezier, steps and linear are parsed correctly', () => {
    expect(
      getParsedAnimation(
        {
          animation:
            '4s cubic-bezier(0.5, 0, 0.5, 1) 0s infinite alternate sun-rise, 2s steps(4, jump-none) 0s infinite alternate sun-rise, 2s linear(0 0%, 0.0101 0.7732%, 0.9982 79.8969%, 1.0004 100%) 0s infinite alternate sun-rise',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '4',
          unit: 's',
        },
        timing: {
          type: 'function',
          name: 'cubic-bezier',
          value: '0.5, 0, 0.5, 1',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
      {
        duration: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        timing: {
          type: 'function',
          name: 'steps',
          value: '4, jump-none',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
      {
        duration: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        timing: {
          type: 'function',
          name: 'linear',
          value: '0 0%, 0.0101 0.7732%, 0.9982 79.8969%, 1.0004 100%',
        },
        delay: {
          type: 'time',
          value: '0',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'alternate',
        },
        iterationCount: {
          type: 'keyword',
          value: 'infinite',
        },
        name: {
          type: 'keyword',
          value: 'sun-rise',
        },
      },
    ])
  })

  test('Complex timing function, as a single property', () => {
    expect(
      getParsedAnimation(
        {
          'animation-duration': '5s',
          'animation-timing-function':
            'linear(0 0%, 0.0101 0.7732%, 0.9982 79.8969%, 1.0004 100%)',
          'animation-delay': '2s',
          'animation-iteration-count': '15',
          'animation-direction': 'reverse',
          'animation-name': 'newName',
          'animation-fill-mode': 'backwards',
          'animation-play-state': 'paused',
        },
        [],
      ),
    ).toEqual([
      {
        duration: {
          type: 'time',
          value: '5',
          unit: 's',
        },
        timing: {
          type: 'function',
          name: 'linear',
          value: '0 0%, 0.0101 0.7732%, 0.9982 79.8969%, 1.0004 100%',
        },
        delay: {
          type: 'time',
          value: '2',
          unit: 's',
        },
        direction: {
          type: 'keyword',
          value: 'reverse',
        },
        iterationCount: {
          type: 'number',
          value: '15',
        },
        name: {
          type: 'keyword',
          value: 'newName',
        },
        fillMode: {
          type: 'keyword',
          value: 'backwards',
        },
        playState: {
          type: 'keyword',
          value: 'paused',
        },
      },
    ])
  })

  test('Should handle when a variable has a null value', () => {
    expect(
      getParsedAnimation(
        {
          animation:
            '3s linear(0 0%, 0.0007 2.8169%, 0.0038 6.338%, 0.0149 12.3239%, 0.0345 18.662%, 0.0604 24.6479%, 0.1391 37.3239%, 0.2468 49.6479%, 0.385 61.9718%, 0.5539 74.2958%, 0.7472 86.2676%, 1 100%) var(--delay) 1 normal none running animation-diMMIZ',
        },
        [
          {
            syntax: {
              type: 'primitive',
              name: 'time',
            },
            formula: null,
            name: '--delay',
            description: '',
            value: null,
          } as any,
        ],
      ),
    ).toEqual([
      {
        delay: {
          name: 'var',
          type: 'function',
          value: '--delay',
        },
        direction: {
          type: 'keyword',
          value: 'normal',
        },
        duration: {
          type: 'time',
          value: '3',
          unit: 's',
        },
        fillMode: {
          type: 'keyword',
          value: 'none',
        },
        iterationCount: {
          type: 'number',
          value: '1',
        },
        name: {
          type: 'keyword',
          value: 'animation-diMMIZ',
        },
        playState: {
          type: 'keyword',
          value: 'running',
        },
        timing: {
          name: 'linear',
          type: 'function',
          value:
            '0 0%, 0.0007 2.8169%, 0.0038 6.338%, 0.0149 12.3239%, 0.0345 18.662%, 0.0604 24.6479%, 0.1391 37.3239%, 0.2468 49.6479%, 0.385 61.9718%, 0.5539 74.2958%, 0.7472 86.2676%, 1 100%',
        },
      },
    ])
  })
})
