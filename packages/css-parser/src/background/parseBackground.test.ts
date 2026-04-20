import { describe, expect, test } from 'bun:test'
import { getParsedBackground } from './parseBackground'

describe('parseBackground', () => {
  test('The background shorthand with all properties is defined', () => {
    expect(
      getParsedBackground(
        {
          background:
            'url(image.png) repeat no-repeat right 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'right',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '10',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'top',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '12',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
          origin: {
            type: 'keyword',
            value: 'border-box',
          },
          clip: {
            type: 'keyword',
            value: 'padding-box',
          },
          attachment: {
            type: 'keyword',
            value: 'scroll',
          },
        },
      ],
      color: { type: 'keyword', value: 'yellow' },
    })
  })

  test('The linear background shorthand with all properties is defined', () => {
    expect(
      getParsedBackground(
        {
          background:
            'linear-gradient(red 10%, blue 90%) repeat no-repeat right 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                    value: '10',
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
                    value: '90',
                  },
                },
              },
            ],
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'right',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '10',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'top',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '12',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
          origin: {
            type: 'keyword',
            value: 'border-box',
          },
          clip: {
            type: 'keyword',
            value: 'padding-box',
          },
          attachment: {
            type: 'keyword',
            value: 'scroll',
          },
        },
      ],
      color: { type: 'keyword', value: 'yellow' },
    })
  })

  test('The linear background shorthand with interpolation and direction', () => {
    expect(
      getParsedBackground(
        {
          background:
            'linear-gradient(in xyz to left, red 0%, blue 50%, yellow 100%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                  value: 'yellow',
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
            direction: {
              type: 'string',
              value: 'to left',
            },
            interpolation: {
              type: 'string',
              value: 'in xyz',
            },
          },
        },
      ],
    })
  })

  test('The linear background shorthand with no stops defined', () => {
    expect(
      getParsedBackground(
        {
          background: 'linear-gradient(red, green, blue)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                  value: 'green',
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
                  value: 'blue',
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

  test('The linear background shorthand with some stops not defined', () => {
    expect(
      getParsedBackground(
        {
          background: 'linear-gradient(red 10%, green, blue 60%)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                    value: '10',
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
                    value: '35',
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
                    value: '60',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('The linear background shorthand with more stops not defined and using a variable', () => {
    expect(
      getParsedBackground(
        {
          background:
            'linear-gradient(red 10%, green, yellow, pink, blue var(--position), grey 100%)',
        },
        [
          {
            name: 'position',
            type: 'value',
            value: '90%',
            category: 'spacing',
          },
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                    value: '10',
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
                    value: '30',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'yellow',
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
                  value: 'pink',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '70',
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
                    name: 'var',
                    type: 'function',
                    value: '--position',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'grey',
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

  test('The linear background shorthand with some stops not defined and using a different units', () => {
    expect(
      getParsedBackground(
        {
          background:
            'linear-gradient(red 10%, green, yellow 50%, pink, blue 200px)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'linear-gradient',
            type: 'linear-function',
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
                    value: '10',
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
                    value: '30',
                  },
                },
              },
              {
                color: {
                  type: 'keyword',
                  value: 'yellow',
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
                  value: 'pink',
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
                    unit: 'px',
                    value: '200',
                  },
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('Multiple backgrounds are defined', () => {
    expect(
      getParsedBackground(
        {
          background:
            'center / contain no-repeat url("/shared-assets/images/examples/firefox-logo.svg"), #eee 35% url("/shared-assets/images/examples/lizard.png")',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: '/shared-assets/images/examples/lizard.png',
          },
          position: {
            x: {
              offset: {
                type: 'length',
                unit: '%',
                value: '35',
              },
            },
          },
        },
        {
          image: {
            name: 'url',
            type: 'function',
            value: '/shared-assets/images/examples/firefox-logo.svg',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'center',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'no-repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
        },
      ],
      color: {
        type: 'hex',
        value: '#eee',
      },
    })
  })

  test('Use defined variable as color', () => {
    expect(
      getParsedBackground(
        {
          background: 'left url("backgroundImage.png") var(--color)',
        },
        [
          {
            name: 'color',
            type: 'value',
            value: 'red',
            category: 'color',
          },
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'backgroundImage.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'left',
              },
            },
          },
        },
      ],
      color: {
        type: 'function',
        name: 'var',
        value: '--color',
      },
    })
  })

  test('If the background is set to one undefined variable we assume that is a color', () => {
    expect(
      getParsedBackground(
        {
          background: 'var(--color)',
        },
        [],
      ),
    ).toEqual({
      color: {
        type: 'function',
        name: 'var',
        value: '--color',
      },
    })
  })

  test('If undefined variable return in order', () => {
    expect(
      getParsedBackground(
        {
          background: 'url(backgroundImage.png) left var(--color)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'backgroundImage.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'left',
              },
              offset: {
                type: 'function',
                name: 'var',
                value: '--color',
              },
            },
          },
        },
      ],
    })
  })

  test('Return the invalid value', () => {
    expect(
      getParsedBackground(
        {
          background:
            'url(image.png) repeat no-repeat invalid 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'invalid',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '10',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'top',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '12',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
          origin: {
            type: 'keyword',
            value: 'border-box',
          },
          clip: {
            type: 'keyword',
            value: 'padding-box',
          },
          attachment: {
            type: 'keyword',
            value: 'scroll',
          },
        },
      ],
      color: { type: 'keyword', value: 'yellow' },
    })
  })

  test('Single properties overrides the shorthand property', () => {
    expect(
      getParsedBackground(
        {
          background:
            'url(image.png) repeat no-repeat right 10px top 12px / contain border-box padding-box scroll yellow',
          'background-image': 'url(new-image.png)',
          'background-repeat': 'repeat-y',
          'background-position': 'left 5px bottom 3px',
          'background-size': 'cover',
          'background-origin': 'padding-box',
          'background-clip': 'border-box',
          'background-attachment': 'fixed',
          'background-color': 'red',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'new-image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'left',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '5',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'bottom',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '3',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'no-repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'cover',
          },
          origin: {
            type: 'keyword',
            value: 'padding-box',
          },
          clip: {
            type: 'keyword',
            value: 'border-box',
          },
          attachment: {
            type: 'keyword',
            value: 'fixed',
          },
        },
      ],
      color: { type: 'keyword', value: 'red' },
    })
  })

  test('Single properties not overrides the shorthand property', () => {
    expect(
      getParsedBackground(
        {
          'background-image': 'url(new-image.png)',
          'background-repeat': 'repeat-y',
          'background-position': 'left 5px bottom 3px',
          'background-size': 'cover',
          'background-origin': 'padding-box',
          'background-clip': 'border-box',
          'background-attachment': 'fixed',
          'background-color': 'red',
          background:
            'url(image.png) repeat no-repeat right 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'right',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '10',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'top',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '12',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
          origin: {
            type: 'keyword',
            value: 'border-box',
          },
          clip: {
            type: 'keyword',
            value: 'padding-box',
          },
          attachment: {
            type: 'keyword',
            value: 'scroll',
          },
        },
      ],
      color: { type: 'keyword', value: 'yellow' },
    })
  })

  test('Single properties overrides the invalid shorthand property', () => {
    expect(
      getParsedBackground(
        {
          'background-image': 'url(new-image.png)',
          'background-repeat': 'repeat-y',
          'background-position': 'left 5px bottom 3px',
          'background-size': 'cover',
          'background-origin': 'padding-box',
          'background-clip': 'border-box',
          'background-attachment': 'fixed',
          'background-color': 'red',
          background:
            'url(image.png) repeat no-repeat invalid 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'new-image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'left',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '5',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'bottom',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '3',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'no-repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'cover',
          },
          origin: {
            type: 'keyword',
            value: 'padding-box',
          },
          clip: {
            type: 'keyword',
            value: 'border-box',
          },
          attachment: {
            type: 'keyword',
            value: 'fixed',
          },
        },
      ],
      color: { type: 'keyword', value: 'red' },
    })
  })

  test('Single properties defined', () => {
    expect(
      getParsedBackground(
        {
          'background-image': 'url(new-image.png)',
          'background-repeat': 'repeat-y',
          'background-position': 'left 5px bottom 3px',
          'background-size': 'cover',
          'background-origin': 'padding-box',
          'background-clip': 'border-box',
          'background-attachment': 'fixed',
          'background-color': 'red',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'url',
            type: 'function',
            value: 'new-image.png',
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'left',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '5',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'bottom',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '3',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'no-repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'cover',
          },
          origin: {
            type: 'keyword',
            value: 'padding-box',
          },
          clip: {
            type: 'keyword',
            value: 'border-box',
          },
          attachment: {
            type: 'keyword',
            value: 'fixed',
          },
        },
      ],
      color: { type: 'keyword', value: 'red' },
    })
  })

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
})

describe('parseBackground', () => {
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
})

// Tests for repeating gradients
describe('parseBackground', () => {
  test('The repeating linear background shorthand with all properties is defined', () => {
    expect(
      getParsedBackground(
        {
          background:
            'repeating-linear-gradient(red 10%, blue 90%) repeat no-repeat right 10px top 12px / contain border-box padding-box scroll yellow',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'repeating-linear-gradient',
            type: 'linear-function',
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
                    value: '10',
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
                    value: '90',
                  },
                },
              },
            ],
          },
          position: {
            x: {
              align: {
                type: 'keyword',
                value: 'right',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '10',
              },
            },
            y: {
              align: {
                type: 'keyword',
                value: 'top',
              },
              offset: {
                type: 'length',
                unit: 'px',
                value: '12',
              },
            },
          },
          repeat: {
            horizontal: {
              type: 'keyword',
              value: 'repeat',
            },
            vertical: {
              type: 'keyword',
              value: 'no-repeat',
            },
          },
          size: {
            type: 'keyword',
            value: 'contain',
          },
          origin: {
            type: 'keyword',
            value: 'border-box',
          },
          clip: {
            type: 'keyword',
            value: 'padding-box',
          },
          attachment: {
            type: 'keyword',
            value: 'scroll',
          },
        },
      ],
      color: { type: 'keyword', value: 'yellow' },
    })
  })

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

// Test the image set
describe('parseBackground', () => {
  test('Background image using image-set', () => {
    expect(
      getParsedBackground(
        {
          'background-image':
            'image-set(url("image1.jpg") var(--resolution-1x, 2x), linear-gradient(var(--red-100), green) 2x, "https://mdn.github.io/shared-assets/images/examples/balloons-landscape.jpg" type("image/jpeg"))',
        },
        [
          {
            name: 'resolution-1x',
            type: 'value',
            value: '1x',
            category: 'spacing',
          },
          {
            name: 'red-100',
            type: 'value',
            value: '#FEE2E2',
            category: 'color',
          },
        ],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'image-set',
            type: 'image-set-function',
            imagesSet: [
              {
                image: {
                  type: 'function',
                  name: 'url',
                  value: '"image1.jpg"',
                },
                resolution: {
                  type: 'function',
                  name: 'var',
                  value: '--resolution-1x, 2x',
                },
              },
              {
                image: {
                  type: 'linear-function',
                  name: 'linear-gradient',
                  stops: [
                    {
                      color: {
                        type: 'function',
                        name: 'var',
                        value: '--red-100',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '0',
                          unit: '%',
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
                          value: '100',
                          unit: '%',
                        },
                      },
                    },
                  ],
                },
                resolution: {
                  type: 'resolution',
                  value: '2',
                  unit: 'x',
                },
              },
              {
                image: {
                  type: 'string',
                  value:
                    'https://mdn.github.io/shared-assets/images/examples/balloons-landscape.jpg',
                  quote: '"',
                },
                type: {
                  type: 'function',
                  name: 'type',
                  value: '"image/jpeg"',
                },
              },
            ],
          },
        },
      ],
    })
  })
  test('Background shorthand property using image-set', () => {
    expect(
      getParsedBackground(
        {
          background:
            'image-set( linear-gradient(blue, white) 1x, linear-gradient(blue, green) 2x)',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'image-set',
            type: 'image-set-function',
            imagesSet: [
              {
                image: {
                  type: 'linear-function',
                  name: 'linear-gradient',
                  stops: [
                    {
                      color: {
                        type: 'keyword',
                        value: 'blue',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '0',
                          unit: '%',
                        },
                      },
                    },
                    {
                      color: {
                        type: 'keyword',
                        value: 'white',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '100',
                          unit: '%',
                        },
                      },
                    },
                  ],
                },
                resolution: {
                  type: 'resolution',
                  value: '1',
                  unit: 'x',
                },
              },
              {
                image: {
                  type: 'linear-function',
                  name: 'linear-gradient',
                  stops: [
                    {
                      color: {
                        type: 'keyword',
                        value: 'blue',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '0',
                          unit: '%',
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
                          value: '100',
                          unit: '%',
                        },
                      },
                    },
                  ],
                },
                resolution: {
                  type: 'resolution',
                  value: '2',
                  unit: 'x',
                },
              },
            ],
          },
        },
      ],
    })
  })
  test('Background image using image-set with linear and radial gradients', () => {
    expect(
      getParsedBackground(
        {
          'background-image':
            'image-set(linear-gradient(green 0%, blue 100%) 2x, radial-gradient(yellow 0%, pink 100%))',
        },
        [],
      ),
    ).toEqual({
      images: [
        {
          image: {
            name: 'image-set',
            type: 'image-set-function',
            imagesSet: [
              {
                image: {
                  type: 'linear-function',
                  name: 'linear-gradient',
                  stops: [
                    {
                      color: {
                        type: 'keyword',
                        value: 'green',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '0',
                          unit: '%',
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
                          value: '100',
                          unit: '%',
                        },
                      },
                    },
                  ],
                },
                resolution: {
                  type: 'resolution',
                  unit: 'x',
                  value: '2',
                },
              },
              {
                image: {
                  type: 'radial-function',
                  name: 'radial-gradient',
                  stops: [
                    {
                      color: {
                        type: 'keyword',
                        value: 'yellow',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '0',
                          unit: '%',
                        },
                      },
                    },
                    {
                      color: {
                        type: 'keyword',
                        value: 'pink',
                      },
                      position: {
                        start: {
                          type: 'length',
                          value: '100',
                          unit: '%',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    })
  })

  test('handles oklch color in background shorthand', () => {
    expect(
      getParsedBackground(
        {
          background: 'oklch(0.7 0.1 200)',
        },
        [],
      ),
    ).toEqual({
      color: {
        type: 'function',
        name: 'oklch',
        value: '0.7 0.1 200',
      },
    })
  })

  test('handles color-mix in background shorthand', () => {
    expect(
      getParsedBackground(
        {
          background:
            'color-mix(in lch increasing hue, hsl(200deg 50% 80%), coral)',
        },
        [],
      ),
    ).toEqual({
      color: {
        type: 'function',
        name: 'color-mix',
        value: 'in lch increasing hue, hsl(200deg 50% 80%), coral',
      },
    })
  })

  test('handles oklch and gradients', () => {
    const result = getParsedBackground(
      {
        background: 'linear-gradient(red, blue) oklch(0.7 0.1 200)',
      },
      [],
    )
    expect(result?.images).toEqual([
      {
        image: {
          direction: undefined,
          interpolation: undefined,
          name: 'linear-gradient',
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
                  value: '100',
                },
              },
            },
          ],
          type: 'linear-function',
        },
      },
    ])
    expect(result?.color).toEqual({
      type: 'function',
      name: 'oklch',
      value: '0.7 0.1 200',
    })
  })
})
