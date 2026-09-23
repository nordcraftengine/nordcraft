import { describe, expect, test } from 'bun:test'
import { getParsedBackground } from './parseBackground'

describe('parseConicGradient', () => {
  test('The conic background shorthand with interpolation', () => {
    expect(
      getParsedBackground(
        {
          background: 'conic-gradient(in hsl longer hue, red, blue, green)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            interpolation: {
              type: 'string',
              value: 'in hsl longer hue',
            },
            stops: [
              {
                color: {
                  type: 'keyword',
                  value: 'red',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '0',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '50',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'green',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '100',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient rotated 45 degrees, starting blue and finishing red', () => {
    expect(
      getParsedBackground(
        {
          background: 'conic-gradient(from 45deg, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: { type: 'angle', unit: 'deg', value: '45' },
            stops: [
              {
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '0',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'red',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '100',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient with position set to 0 0', () => {
    expect(
      getParsedBackground(
        {
          background: 'conic-gradient(from 90deg at 0 0, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: { type: 'angle', unit: 'deg', value: '90' },
            position: {
              x: {
                offset: { type: 'number', value: '0' },
              },
              y: {
                offset: { type: 'number', value: '0' },
              },
            },
            stops: [
              {
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '0',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'red',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '100',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient with many stops using percentage', () => {
    expect(
      getParsedBackground(
        {
          background:
            'conic-gradient(from 45deg at 50% 50%, rgb(0,0,0) 0 25%, yellow 25% 50%, green 50% 75%, blue 75% 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: { type: 'angle', unit: 'deg', value: '45' },
            position: {
              x: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  name: 'rgb',
                  type: 'function',
                  value: '0, 0, 0',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '25' },
                  end: { type: 'length', unit: '%', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '50' },
                  end: { type: 'length', unit: '%', value: '75' },
                },
                color: {
                  type: 'keyword',
                  value: 'green',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '75' },
                  end: { type: 'length', unit: '%', value: '100' },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient with many stops using angle units', () => {
    expect(
      getParsedBackground(
        {
          background:
            'conic-gradient(from 45deg at 50% 50%, rgb(0,0,0) 0 25%, yellow 25deg 50deg, green 50rad 75rad, blue 75% 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: { type: 'angle', unit: 'deg', value: '45' },
            position: {
              x: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  name: 'rgb',
                  type: 'function',
                  value: '0, 0, 0',
                },
              },
              {
                position: {
                  start: { type: 'angle', unit: 'deg', value: '25' },
                  end: { type: 'angle', unit: 'deg', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: { type: 'angle', unit: 'rad', value: '50' },
                  end: { type: 'angle', unit: 'rad', value: '75' },
                },
                color: {
                  type: 'keyword',
                  value: 'green',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '75' },
                  end: { type: 'length', unit: '%', value: '100' },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient with variables', () => {
    expect(
      getParsedBackground(
        {
          background:
            'conic-gradient(from var(--angle) at var(--positionX) 50%, red 0 25%, yellow 25% 50%, var(--red-100) 50% 75%, blue var(--startPosition) var(--endPosition))',
        },
        [
          {
            name: 'angle',
            type: 'value',
            value: '45deg',
            category: 'spacing',
          },
          {
            name: 'positionX',
            type: 'value',
            value: '50%',
            category: 'spacing',
          },
          {
            name: '--red-100',
            type: 'value',
            value: '#FEE2E2',
            category: 'color',
          },
          {
            name: 'startPosition',
            type: 'value',
            value: '75%',
            category: 'spacing',
          },
          {
            name: 'endPosition',
            type: 'value',
            value: '100%',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: {
              name: 'var',
              type: 'function',
              value: '--angle',
            },
            position: {
              x: {
                offset: {
                  name: 'var',
                  type: 'function',
                  value: '--positionX',
                },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  type: 'keyword',
                  value: 'red',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '25' },
                  end: { type: 'length', unit: '%', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '50' },
                  end: { type: 'length', unit: '%', value: '75' },
                },
                color: {
                  name: 'var',
                  type: 'function',
                  value: '--red-100',
                },
              },
              {
                position: {
                  start: {
                    name: 'var',
                    type: 'function',
                    value: '--startPosition',
                  },
                  end: {
                    name: 'var',
                    type: 'function',
                    value: '--endPosition',
                  },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A conic gradient with stop that use calc function', () => {
    expect(
      getParsedBackground(
        {
          background:
            'conic-gradient(from var(--angle) at var(--positionX) 50%, red 0 25%, yellow 25% 50%, blue calc(25deg + 20deg) var(--endPosition))',
        },
        [
          {
            name: 'angle',
            type: 'value',
            value: '45deg',
            category: 'spacing',
          },
          {
            name: 'positionX',
            type: 'value',
            value: '50%',
            category: 'spacing',
          },
          {
            name: 'endPosition',
            type: 'value',
            value: '100%',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: {
              name: 'var',
              type: 'function',
              value: '--angle',
            },
            position: {
              x: {
                offset: {
                  name: 'var',
                  type: 'function',
                  value: '--positionX',
                },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  type: 'keyword',
                  value: 'red',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '25' },
                  end: { type: 'length', unit: '%', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: {
                    name: 'calc',
                    type: 'function',
                    value: '25deg + 20deg',
                  },
                  end: {
                    name: 'var',
                    type: 'function',
                    value: '--endPosition',
                  },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('Should handle when a variable has a null value', () => {
    expect(
      getParsedBackground(
        {
          background:
            'conic-gradient(from var(--angle) at var(--positionX) 50%, red 0 25%, yellow 25% 50%, var(--red-100) 50% 75%, blue var(--startPosition) var(--endPosition))',
        },
        [
          {
            name: 'positionX',
            type: 'value',
            value: '50%',
            category: 'spacing',
          },
          {
            name: '--red-100',
            type: 'value',
            value: '#FEE2E2',
            category: 'color',
          },
          {
            name: 'startPosition',
            type: 'value',
            value: '75%',
            category: 'spacing',
          },
          {
            name: 'endPosition',
            type: 'value',
            value: '100%',
            category: 'spacing',
          },
          {
            description: undefined,
            formula: null,
            name: '--angle',
            syntax: { type: 'primitive', name: 'angle' },
            value: null,
          } as any,
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'conic-gradient',
            type: 'conic-function',
            angle: {
              name: 'var',
              type: 'function',
              value: '--angle',
            },
            position: {
              x: {
                offset: {
                  name: 'var',
                  type: 'function',
                  value: '--positionX',
                },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  type: 'keyword',
                  value: 'red',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '25' },
                  end: { type: 'length', unit: '%', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '50' },
                  end: { type: 'length', unit: '%', value: '75' },
                },
                color: {
                  name: 'var',
                  type: 'function',
                  value: '--red-100',
                },
              },
              {
                position: {
                  start: {
                    name: 'var',
                    type: 'function',
                    value: '--startPosition',
                  },
                  end: {
                    name: 'var',
                    type: 'function',
                    value: '--endPosition',
                  },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })
})

// Tests for repeating gradients
describe('parseConicGradient', () => {
  test('A repeating conic gradient with many stops', () => {
    expect(
      getParsedBackground(
        {
          background:
            'repeating-conic-gradient(from 45deg at 50% 50%, rgb(0,0,0) 0 25%, yellow 25% 50%, green 50% 75%, blue 75% 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'repeating-conic-gradient',
            type: 'conic-function',
            angle: { type: 'angle', unit: 'deg', value: '45' },
            position: {
              x: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
              y: {
                offset: { type: 'length', unit: '%', value: '50' },
              },
            },
            stops: [
              {
                position: {
                  start: {
                    type: 'number',
                    value: '0',
                  },
                  end: { type: 'length', unit: '%', value: '25' },
                },
                color: {
                  name: 'rgb',
                  type: 'function',
                  value: '0, 0, 0',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '25' },
                  end: { type: 'length', unit: '%', value: '50' },
                },
                color: {
                  type: 'keyword',
                  value: 'yellow',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '50' },
                  end: { type: 'length', unit: '%', value: '75' },
                },
                color: {
                  type: 'keyword',
                  value: 'green',
                },
              },
              {
                position: {
                  start: { type: 'length', unit: '%', value: '75' },
                  end: { type: 'length', unit: '%', value: '100' },
                },
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
            ],
          },
        },
      ],
    })
  })
})
