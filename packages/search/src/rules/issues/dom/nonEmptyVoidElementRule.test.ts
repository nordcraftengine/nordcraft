import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { nonEmptyVoidElementRule } from './nonEmptyVoidElementRule'

describe('voidElementRule', () => {
  test('should detect void elements with children', () => {
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
                  children: ['other'],
                  style: {},
                },
                other: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'p',
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
        rules: [nonEmptyVoidElementRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('non-empty void element')
    expect(problems[0].details).toEqual({ tag: 'img' })
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })

  test('should not detect void elements with no children', () => {
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
                  tag: 'input',
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
        rules: [nonEmptyVoidElementRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
