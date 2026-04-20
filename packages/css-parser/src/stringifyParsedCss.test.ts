import { describe, expect, test } from 'bun:test'
import { parsedCssToString } from './stringifyParsedCss'

describe('parsedCssToString', () => {
  test('The padding is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          padding: {
            left: { type: 'length', value: '2', unit: 'px' },
            right: { type: 'length', value: '4', unit: 'px' },
            top: { type: 'length', value: '6', unit: 'px' },
            bottom: { type: 'length', value: '8', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      padding: '6px 4px 8px 2px',
    })
  })
  test('The margin is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          margin: {
            left: { type: 'length', value: '2', unit: 'px' },
            right: { type: 'length', value: '4', unit: 'px' },
            top: { type: 'length', value: '6', unit: 'px' },
            bottom: { type: 'length', value: '8', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      margin: '6px 4px 8px 2px',
    })
  })

  test('The inset is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          inset: {
            left: { type: 'length', value: '2', unit: 'px' },
            right: { type: 'length', value: '4', unit: 'px' },
            top: { type: 'length', value: '6', unit: 'px' },
            bottom: { type: 'length', value: '8', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      inset: '6px 4px 8px 2px',
    })
  })

  test('The transition is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          transition: [
            {
              duration: { type: 'time', value: '2', unit: 's' },
              delay: { type: 'time', value: '3', unit: 's' },
              property: { type: 'keyword', value: 'margin-right' },
              timing: { type: 'keyword', value: 'ease-in-out' },
              behavior: { type: 'keyword', value: 'normal' },
            },
          ],
        },
      }),
    ).toEqual({
      transition: 'margin-right 2s ease-in-out 3s normal',
    })
  })

  test('The box shadow is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          boxShadow: [
            {
              horizontal: { type: 'length', value: '2', unit: 'px' },
              vertical: { type: 'length', value: '2', unit: 'px' },
              blur: { type: 'length', value: '3', unit: 'px' },
              spread: { type: 'length', value: '4', unit: 'px' },
              color: { type: 'keyword', value: 'red' },
              position: { type: 'keyword', value: 'inside' },
            },
          ],
        },
      }),
    ).toEqual({
      'box-shadow': '2px 2px 3px 4px red inside',
    })
  })

  test('The text shadow is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          textShadow: [
            {
              horizontal: { type: 'length', value: '2', unit: 'px' },
              vertical: { type: 'length', value: '2', unit: 'px' },
              blur: { type: 'length', value: '3', unit: 'px' },
              color: { type: 'keyword', value: 'red' },
            },
          ],
        },
      }),
    ).toEqual({
      'text-shadow': '2px 2px 3px red',
    })
  })

  test('The border is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          border: {
            all: {
              width: { type: 'length', value: '3', unit: 'px' },
              style: { type: 'keyword', value: 'solid' },
              color: { type: 'keyword', value: 'blue' },
            },
          },
        },
      }),
    ).toEqual({
      border: '3px solid blue',
    })
  })

  test('The border-top is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          border: {
            top: {
              width: { type: 'length', value: '3', unit: 'px' },
              style: { type: 'keyword', value: 'solid' },
              color: { type: 'keyword', value: 'blue' },
            },
          },
        },
      }),
    ).toEqual({
      'border-top': '3px solid blue',
    })
  })

  test('The border-bottom is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          border: {
            bottom: {
              width: { type: 'length', value: '3', unit: 'px' },
              style: { type: 'keyword', value: 'solid' },
              color: { type: 'keyword', value: 'blue' },
            },
          },
        },
      }),
    ).toEqual({
      'border-bottom': '3px solid blue',
    })
  })

  test('The border-left is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          border: {
            left: {
              width: { type: 'length', value: '3', unit: 'px' },
              style: { type: 'keyword', value: 'solid' },
              color: { type: 'keyword', value: 'blue' },
            },
          },
        },
      }),
    ).toEqual({
      'border-left': '3px solid blue',
    })
  })

  test('The border-right is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          border: {
            right: {
              width: { type: 'length', value: '3', unit: 'px' },
              style: { type: 'keyword', value: 'solid' },
              color: { type: 'keyword', value: 'blue' },
            },
          },
        },
      }),
    ).toEqual({
      'border-right': '3px solid blue',
    })
  })

  test('The border radius is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          borderRadius: {
            topLeft: { horizontal: { type: 'length', value: '2', unit: 'px' } },
            topRight: {
              horizontal: { type: 'length', value: '2', unit: 'px' },
            },
            bottomLeft: {
              horizontal: { type: 'length', value: '2', unit: 'px' },
            },
            bottomRight: {
              horizontal: { type: 'length', value: '2', unit: 'px' },
            },
          },
        },
      }),
    ).toEqual({
      borderRadius: '2px',
    })
  })

  test('The translate is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          translate: {
            type: 'axis',
            x: { type: 'number', value: '1' },
          },
        },
      }),
    ).toEqual({
      translate: '1 0 0',
    })
  })

  test('The scale is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          scale: {
            type: 'axis',
            x: { type: 'number', value: '1' },
          },
        },
      }),
    ).toEqual({
      scale: '1 1 1',
    })
  })

  test('The rotate is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          rotate: {
            type: 'axis',
            x: { type: 'number', value: '1' },
            y: { type: 'number', value: '1' },
            angle: { type: 'angle', value: '45', unit: 'deg' },
          },
        },
      }),
    ).toEqual({
      rotate: '1 1 0 45deg',
    })
  })

  test('The perspective is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          perspective: { type: 'length', value: '5.5', unit: 'cm' },
        },
      }),
    ).toEqual({
      perspective: '5.5cm',
    })
  })

  test('The transform is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          transform: {
            all: [
              {
                rotate: { angle: { type: 'length', value: '45', unit: 'deg' } },
              },
            ],
            transformOrigin: {
              x: { type: 'length', value: '50', unit: 'px' },
              y: null,
              z: null,
            },
            transformStyle: { type: 'keyword', value: 'preserve-3d' },
            transformBox: { type: 'keyword', value: 'content-box' },
          },
        },
      }),
    ).toEqual({
      transform: 'rotate(45deg)',
      'transform-origin': '50px center',
      'transform-style': 'preserve-3d',
      'transform-box': 'content-box',
    })
  })

  test('The font is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          font: {
            family: [
              { type: 'string', value: 'Fira Sans', quote: '"' },
              { type: 'keyword', value: 'sans-serif' },
            ],
            size: { type: 'length', value: '1.2', unit: 'rem' },
          },
        },
      }),
    ).toEqual({
      font: '1.2rem "Fira Sans", sans-serif',
    })
  })

  test('The background is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          background: {
            color: {
              type: 'hex',
              value: '#e07171',
            },
            images: [
              {
                image: {
                  type: 'function',
                  value:
                    'https://toddle.dev/cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/toddle:toddle-default-image.jpg/540',
                  name: 'url',
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
                position: {
                  x: {
                    align: {
                      type: 'keyword',
                      value: 'center',
                    },
                  },
                  y: {
                    align: {
                      type: 'keyword',
                      value: 'center',
                    },
                  },
                },
                size: {
                  type: 'keyword',
                  value: 'cover',
                },
              },
            ],
          },
        },
      }),
    ).toEqual({
      background:
        'url("https://toddle.dev/cdn-cgi/imagedelivery/ZIty0Vhmkm0nD-fBKJrTZQ/toddle:toddle-default-image.jpg/540") no-repeat no-repeat center center / cover #e07171',
    })
  })

  test('The linear background is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          background: {
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
          },
        },
      }),
    ).toEqual({
      background:
        'linear-gradient(in xyz to left, red 0%, blue 50%, yellow 100%)',
    })
  })

  test('The linear background with image-set is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          background: {
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
              {
                image: {
                  type: 'image-set-function',
                  name: 'image-set',
                  imagesSet: [
                    {
                      image: {
                        type: 'linear-function',
                        name: 'linear-gradient',
                        stops: [
                          {
                            color: {
                              value: 'green',
                              type: 'keyword',
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
                        value: '2',
                        unit: 'x',
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
                          },
                          {
                            color: {
                              type: 'keyword',
                              value: 'pink',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      }),
    ).toEqual({
      background:
        'image-set(linear-gradient(green 0%, blue 100%) 2x, radial-gradient(yellow, pink)), linear-gradient(in xyz to left, red 0%, blue 50%, yellow 100%)',
    })
  })

  test('The outline is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          outline: {
            width: { type: 'length', value: '3', unit: 'px' },
            style: { type: 'keyword', value: 'solid' },
            color: { type: 'keyword', value: 'pink' },
          },
        },
      }),
    ).toEqual({
      outline: '3px solid pink',
    })
  })

  test('The gap is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          gap: {
            row: { type: 'length', value: '3', unit: 'px' },
            column: { type: 'length', value: '5', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      'row-gap': '3px',
      'column-gap': '5px',
    })
  })

  test('The overflow is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          overflow: {
            x: { type: 'length', value: '3', unit: 'px' },
            y: { type: 'length', value: '5', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      'overflow-x': '3px',
      'overflow-y': '5px',
    })
  })

  test('The text decoration is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          textDecoration: {
            line: [{ type: 'keyword', value: 'underline' }],
            style: { type: 'keyword', value: 'dotted' },
            color: { type: 'keyword', value: 'green' },
            thickness: { type: 'length', value: '2', unit: 'px' },
          },
        },
      }),
    ).toEqual({
      textDecoration: 'underline dotted green 2px',
    })
  })

  test('The flex is defined', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          flex: {
            grow: { type: 'number', value: '1' },
          },
        },
      }),
    ).toEqual({
      flex: '1',
    })
  })

  test('Transition with inline comment keeps comment', () => {
    expect(
      parsedCssToString({
        parsedCss: {
          transition: [
            {
              property: { type: 'keyword', value: 'color' },
              duration: { type: 'time', value: '3', unit: 's' },
              delay: { type: 'time', value: '1', unit: 's' },
              timing: {
                type: 'function',
                name: 'linear',
                value:
                  '0 0%, 0.0087 0.8537%, 0.9998 100% /*{"type":"spring","stiffness":65,"damping":20,"mass":5}*/',
              },
            },
          ],
        },
      }),
    ).toEqual({
      transition:
        'color 3s linear(0 0%, 0.0087 0.8537%, 0.9998 100% /*{"type":"spring","stiffness":65,"damping":20,"mass":5}*/) 1s',
    })
  })
})
