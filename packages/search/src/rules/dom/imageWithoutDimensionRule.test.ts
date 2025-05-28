import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
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
})
