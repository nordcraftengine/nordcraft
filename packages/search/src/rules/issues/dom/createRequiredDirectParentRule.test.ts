import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { createRequiredDirectParentRule } from './createRequiredDirectParentRule'

describe('createRequiredDirectParentRule', () => {
  test('should detect wrong direct parent', () => {
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
        rules: [
          createRequiredDirectParentRule(
            ['ul', 'ol'],
            ['li', 'script', 'template'],
          ),
        ],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('required direct parent')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'child1'])
    expect(problems[0].details).toEqual({
      parentTag: 'div',
      childTag: 'li',
      allowedParentTags: ['ul', 'ol'],
    })
    expect(problems[1].code).toBe('required direct parent')
    expect(problems[1].path).toEqual(['components', 'test', 'nodes', 'child2'])
    expect(problems[1].details).toEqual({
      parentTag: 'div',
      childTag: 'li',
      allowedParentTags: ['ul', 'ol'],
    })
  })
  test('should not detect valid direct parent', () => {
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
        rules: [createRequiredDirectParentRule(['ul'], ['li'])],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
