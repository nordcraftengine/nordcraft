import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { noReferenceStyleVarRule } from './noReferenceStyleVarRule'

describe('noReferenceStyleVarRule', () => {
  test('should find style vars with no reference', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'main',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: 'var(--my-var)',
                  },
                  events: {},
                  classes: {},
                  children: [],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceStyleVarRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].details.key).toBe('gap')
    expect(problems[0].details.value).toBe('var(--my-var)')
  })

  test('should not find style vars when referenced in theme', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            default: {
              fonts: [],
              propertyDefinitions: {
                '--my-var': {
                  syntax: { type: 'primitive', name: 'length' },
                  description: 'A custom length',
                  inherits: true,
                  initialValue: '0px',
                  value: '10px',
                },
              },
            },
          },
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'main',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: 'var(--my-var)',
                  },
                  events: {},
                  classes: {},
                  children: [],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceStyleVarRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not find style vars when referenced in legacy theme', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            default: {
              fonts: [],
              spacing: [
                {
                  name: 'Default spacing',
                  tokens: [
                    {
                      name: 'my-var',
                      value: '10px',
                      type: 'value',
                    },
                  ],
                },
              ],
            },
          },
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'main',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: 'var(--my-var)',
                  },
                  events: {},
                  classes: {},
                  children: [],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceStyleVarRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  // This should ideally be caught by a different rule where we suggest declaring variables globally
  test('should not find style vars when referenced in element style variable', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'main',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: 'var(--my-var)',
                  },
                  events: {},
                  classes: {},
                  children: [],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            other: {
              name: 'other',
              nodes: {
                root: {
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {},
                  events: {},
                  classes: {},
                  children: [],
                  customProperties: {
                    '--my-var': {
                      formula: {
                        type: 'value',
                        value: '20px',
                      },
                    },
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
        rules: [noReferenceStyleVarRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
