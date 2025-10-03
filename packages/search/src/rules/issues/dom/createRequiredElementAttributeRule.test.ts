import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { createRequiredElementAttributeRule } from './createRequiredElementAttributeRule'

describe('requiredElementAttributeRule', () => {
  test('should detect missing required element attribute', () => {
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
        rules: [
          createRequiredElementAttributeRule({
            tag: 'img',
            attribute: 'alt',
            allowEmptyString: true,
          }),
        ],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('required element attribute')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })
  test('should detect empty required element attribute', () => {
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
                    alt: { type: 'value', value: '' },
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
        rules: [
          createRequiredElementAttributeRule({ tag: 'img', attribute: 'src' }),
        ],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('required element attribute')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })
  test('should not detect issues when elements can have empty attributes', () => {
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
                    alt: { type: 'value', value: '' },
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
        rules: [
          createRequiredElementAttributeRule({
            tag: 'img',
            attribute: 'alt',
            allowEmptyString: true,
          }),
        ],
      }),
    )

    expect(problems).toHaveLength(0)
  })
  test('should not detect issues when elements have all required attributes', () => {
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
                    alt: { type: 'value', value: 'test' },
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
        rules: [
          createRequiredElementAttributeRule({ tag: 'img', attribute: 'alt' }),
        ],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
