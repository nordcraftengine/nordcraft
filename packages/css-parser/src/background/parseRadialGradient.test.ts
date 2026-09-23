import { describe, expect, test } from 'bun:test'
import { getParsedBackground } from './parseBackground'

describe('parseRadialGradient', () => {
  test('The radial background shorthand with interpolation', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(in hsl longer hue, red, blue, green)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
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

  test('A radial gradient rotated 45 degrees, starting blue and finishing red', () => {
    expect(
      getParsedBackground(
        {
          background:
            'radial-gradient(circle at center, red 0, blue, green 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            shape: { type: 'keyword', value: 'circle' },
            position: {
              x: { align: { type: 'keyword', value: 'center' } },
              y: { align: { type: 'keyword', value: 'center' } },
            },
            stops: [
              {
                color: {
                  type: 'keyword',
                  value: 'red',
                },
                position: {
                  start: { type: 'number', value: '0' },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'blue',
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'green',
                },
                position: {
                  start: { type: 'length', unit: '%', value: '100' },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A radial gradient with shape, size, position and many stops defined using percentage', () => {
    expect(
      getParsedBackground(
        {
          background:
            'radial-gradient(circle farthest-corner at 100%, #333, #333 50%, #eee 75%, #333 75%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            shape: { type: 'keyword', value: 'circle' },
            size: { type: 'keyword', value: 'farthest-corner' },
            position: {
              x: {
                offset: { type: 'length', unit: '%', value: '100' },
              },
            },
            stops: [
              {
                color: {
                  type: 'hex',
                  value: '#333',
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
                  type: 'hex',
                  value: '#333',
                },
                position: {
                  start: { type: 'length', unit: '%', value: '50' },
                },
              },
              {
                color: {
                  type: 'hex',
                  value: '#eee',
                },
                position: {
                  start: { type: 'length', unit: '%', value: '75' },
                },
              },
              {
                color: {
                  type: 'hex',
                  value: '#333',
                },
                position: {
                  start: { type: 'length', unit: '%', value: '75' },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A radial gradient with stops defined using another units', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(#333 50px, #eee 175px, #000 300px)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            stops: [
              {
                color: {
                  type: 'hex',
                  value: '#333',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: 'px',
                    value: '50',
                  },
                },
              },
              {
                color: {
                  type: 'hex',
                  value: '#eee',
                },
                position: {
                  start: { type: 'length', unit: 'px', value: '175' },
                },
              },
              {
                color: {
                  type: 'hex',
                  value: '#000',
                },
                position: {
                  start: { type: 'length', unit: 'px', value: '300' },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A radial gradient with using calc for stop position', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(#333 50px, #eee calc(200px - 35px))',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            stops: [
              {
                color: {
                  type: 'hex',
                  value: '#333',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: 'px',
                    value: '50',
                  },
                },
              },
              {
                color: {
                  type: 'hex',
                  value: '#eee',
                },
                position: {
                  start: {
                    type: 'function',
                    name: 'calc',
                    value: '200px - 35px',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('A radial gradient with position set to 0 0', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(ellipse at 0 0, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            shape: {
              type: 'keyword',
              value: 'ellipse',
            },
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

  test('A radial gradient with position set to two values', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(at bottom 100%, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            position: {
              x: {
                offset: { type: 'length', value: '100', unit: '%' },
              },
              y: {
                align: { type: 'keyword', value: 'bottom' },
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

  test('A radial gradient with position set to three values', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(at bottom 10% left, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            position: {
              x: {
                align: { type: 'keyword', value: 'left' },
              },
              y: {
                align: { type: 'keyword', value: 'bottom' },
                offset: { type: 'length', value: '10', unit: '%' },
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

  test('A radial gradient with position set to four values', () => {
    expect(
      getParsedBackground(
        {
          background: 'radial-gradient(at top 10% left 15%, blue, red)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
            position: {
              x: {
                align: { type: 'keyword', value: 'left' },
                offset: { type: 'length', value: '15', unit: '%' },
              },
              y: {
                align: { type: 'keyword', value: 'top' },
                offset: { type: 'length', value: '10', unit: '%' },
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

  test('A radial gradient with many stops', () => {
    expect(
      getParsedBackground(
        {
          background:
            'radial-gradient(at 50% 50%, rgb(0,0,0) 0 25%, yellow 25% 50%, green 50% 75%, blue 75% 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'radial-gradient',
            type: 'radial-function',
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

  test('A radial gradient with variables', () => {
    expect(
      getParsedBackground(
        {
          background:
            'radial-gradient(at var(--positionX) 50%, red 0 25%, yellow 25% 50%, var(--red-100) 50% 75%, blue var(--startPosition) var(--endPosition))',
        },
        [
          {
            name: 'positionX',
            type: 'value',
            value: '50%',
            category: 'spacing',
          },
          {
            name: 'red-100',
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
            name: 'radial-gradient',
            type: 'radial-function',
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

  test('A repeating radial gradient with many stops', () => {
    expect(
      getParsedBackground(
        {
          background:
            'repeating-radial-gradient(at 50% 50%, rgb(0,0,0) 0 25%, yellow 25% 50%, green 50% 75%, blue 75% 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'repeating-radial-gradient',
            type: 'radial-function',
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
