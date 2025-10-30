import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { imageWithoutDimensionRule } from './imageWithoutDimensionRule'

describe('imageWithoutDimensionRule', () => {
  test('should detect missing image dimensions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('image without dimension')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })

  test('should not detect image with explicit dimensions set', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    width: {
                      type: 'value',
                      value: '100',
                    },
                    height: {
                      type: 'value',
                      value: '100',
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should report if image has width but no height', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    width: {
                      type: 'value',
                      value: '100',
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'source',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('image without dimension')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })

  test('should report if image has height but no width', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    height: {
                      type: 'value',
                      value: '100',
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'source',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('image without dimension')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })

  test('should report if only aspect-ratio is set', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'source',
                  children: [],
                  style: {
                    'aspect-ratio': '16/9',
                  },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('image without dimension')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })

  test('should not report if aspect-ratio and one dimension is set', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    width: {
                      type: 'value',
                      value: '100',
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {
                    'aspect-ratio': '16/9',
                  },
                },
                other: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {
                    height: '200px',
                    'aspect-ratio': '4/3',
                  },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report if dimensions are dynamic', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    width: {
                      type: 'path',
                      path: ['Variables', 'imageWidth'],
                    },
                    height: {
                      type: 'path',
                      path: ['Variables', 'imageHeight'],
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report non-image elements', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should report if dimensions are set to non-static keywords (auto | empty string)', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    width: {
                      type: 'value',
                      value: 'auto',
                    },
                  },
                  classes: {},
                  events: {},
                  tag: 'img',
                  children: [],
                  style: {
                    height: '',
                  },
                },
                other: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'source',
                  children: [],
                  style: {
                    width: '100%',
                    'aspect-ratio': 'auto',
                  },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [imageWithoutDimensionRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('image without dimension')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
    expect(problems[1].path).toEqual(['components', 'test', 'nodes', 'other'])
  })
})
