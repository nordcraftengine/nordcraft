import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { createStaticSizeConstraintRule } from './createStaticSizeConstraintRule'

describe('createStaticSizeConstraintRule', () => {
  test('should calculate element size correctly', () => {
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
                  children: ['svg'],
                  style: {},
                },
                svg: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'svg',
                  children: ['path'],
                  style: {},
                },
                path: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'path',
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
        rules: [createStaticSizeConstraintRule('svg', 1)],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('size constraint')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'svg'])
    const expectedSize = new Blob(['<svg><path></path></svg>']).size
    expect(problems[0].details.size).toEqual(expectedSize)
  })
  test('should ignore elements that are not too large', () => {
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
                  children: ['svg'],
                  style: {},
                },
                svg: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'svg',
                  children: ['path'],
                  style: {},
                },
                path: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'path',
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
        rules: [createStaticSizeConstraintRule('svg', 100)],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
