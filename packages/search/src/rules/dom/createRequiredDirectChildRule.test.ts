import { searchProject } from '../../searchProject'
import { createRequiredDirectChildRule } from './createRequiredDirectChildRule'

import { describe, expect, test } from 'bun:test'
describe('createRequiredDirectChildRule', () => {
  test('should detect wrong direct children', () => {
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
                  tag: 'ul',
                  children: ['child1', 'child2'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'p',
                  children: [],
                  style: {},
                },
                child2: {
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
        rules: [createRequiredDirectChildRule(['ul'], ['li'])],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('required direct child')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'child1'])
    expect(problems[0].details).toEqual({
      parentTag: 'ul',
      childTag: 'p',
      allowedChildTags: ['li'],
    })
    expect(problems[1].code).toBe('required direct child')
    expect(problems[1].path).toEqual(['components', 'test', 'nodes', 'child2'])
    expect(problems[1].details).toEqual({
      parentTag: 'ul',
      childTag: 'img',
      allowedChildTags: ['li'],
    })
  })
  test('should not detect valid direct children', () => {
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
                  tag: 'ul',
                  children: ['child1', 'child2'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'li',
                  children: [],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'li',
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
        rules: [createRequiredDirectChildRule(['ul'], ['li'])],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
