import { describe, expect, test } from 'bun:test'
import { getParsedBackground } from './parseBackground'

describe('parseBackground', () => {
  test('The background shorthand with one variable that has an invalid value', () => {
    expect(
      getParsedBackground(
        {
          background: 'var(--invalidValue)',
        },
        [
          {
            syntax: {
              name: '*',
              type: 'primitive',
            },
            description: '',
            name: '--invalidValue',
            value:
              ' 0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
          } as any,
        ],
      ),
    ).toEqual({
      color: {
        name: 'var',
        type: 'function',
        value: '--invalidValue',
      },
    })
  })

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

describe('parseBackground', () => {
  test('The linear background shorthand with invalid value for an angle', () => {
    expect(
      getParsedBackground(
        {
          background:
            'linear-gradient(wjote, #fff200 0% 100%, white 50%, white 55%, yellow 100%) scroll border-box padding-box repeat repeat 0% 0% / auto',
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
                  type: 'hex',
                  value: '#fff200',
                },
                position: {
                  start: {
                    type: 'length',
                    unit: '%',
                    value: '0',
                  },
                  end: {
                    type: 'length',
                    unit: '%',
                    value: '100',
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
                    unit: '%',
                    value: '50',
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
                    unit: '%',
                    value: '55',
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
              type: 'keyword',
              value: 'wjote',
            },
          },
          position: {
            x: {
              offset: {
                type: 'length',
                unit: '%',
                value: '0',
              },
            },
            y: {
              offset: {
                type: 'length',
                unit: '%',
                value: '0',
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
              value: 'repeat',
            },
          },
          size: {
            type: 'widthHeight',
            width: {
              type: 'keyword',
              value: 'auto',
            },
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
    })
  })
})
