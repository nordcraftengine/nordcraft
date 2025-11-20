import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noReferenceGlobalCSSVariableRule } from './noReferenceGlobalCSSVariable'

describe('noReferenceGlobalCSSVariableRule', () => {
  test('should not report global CSS variables that are used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A global color',
                  inherits: true,
                  initialValue: 'blue',
                  values: {},
                },
                '--local-margin': {
                  syntax: { type: 'primitive', name: 'length-percentage' },
                  description: 'A local margin',
                  inherits: true,
                  initialValue: '10px',
                  values: {},
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
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'var(--global-color)',
                    margin: 'var(--local-margin)',
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
        rules: [noReferenceGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should report global CSS variables that are never used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A global color',
                  inherits: true,
                  initialValue: 'blue',
                  values: {},
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
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'red',
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
        rules: [noReferenceGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].level).toBe('warning')
    expect(problems[0].code).toBe('no-reference global css variable')
    expect(problems[0].path).toEqual([
      'themes',
      'Default',
      'propertyDefinitions',
      '--global-color',
    ])
    expect(problems[0].details).toEqual({ name: '--global-color' })
  })

  test('should handle complex use syntax: calc, with fallback value etc.', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A global color',
                  inherits: true,
                  initialValue: 'blue',
                  values: {},
                },
                '--another-global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'Another global color',
                  inherits: true,
                  initialValue: 'green',
                  values: {},
                },
                '--a-third-global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A third global color',
                  inherits: true,
                  initialValue: 'yellow',
                  values: {},
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
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'calc(var(--global-color, red) + 10%)',
                  },
                  events: {},
                  classes: {},
                  children: [],
                  variants: [
                    {
                      breakpoint: 'medium',
                      style: {
                        backgroundColor:
                          'color-mix(in srgb, plum, var(--a-third-global-color))',
                      },
                    },
                  ],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].details).toEqual({ name: '--another-global-color' })
  })

  test('should not report when variable is used in other theme property definitions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--global-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A global color',
                  inherits: true,
                  initialValue: 'blue',
                  values: {},
                },
                '--local-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A local color',
                  inherits: true,
                  initialValue: 'var(--global-color)',
                  values: {},
                },
                '--another-local-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'Another local color',
                  inherits: true,
                  initialValue: 'green',
                  values: {},
                },
                '--a-third-local-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A third local color',
                  inherits: true,
                  initialValue: 'yellow',
                  values: {
                    Default: 'calc(var(--another-local-color, red) + 10%)',
                  },
                },
              },
            },
          },
          formulas: {},
          components: {},
        },
        rules: [noReferenceGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].details).toEqual({ name: '--local-color' })
    expect(problems[1].details).toEqual({ name: '--a-third-local-color' })
  })
})
