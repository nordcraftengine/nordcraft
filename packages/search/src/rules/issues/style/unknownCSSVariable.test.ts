import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownCSSVariableRule } from './unknownCSSVariable'

describe('unknownCSSVariableRule', () => {
  test('should not report CSS variables that are defined in the global theme', () => {
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
                    margin: 'calc(var(--local-margin) + 5px)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report CSS variables that are defined in ancestors', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {},
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
                  style: {},
                  events: {},
                  classes: {},
                  children: ['child'],
                  customProperties: {
                    '--local-color': {
                      formula: {
                        type: 'value',
                        value: 'blue',
                      },
                    },
                  },
                },
                child: {
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  customProperties: {
                    '--own-color': {
                      formula: {
                        type: 'value',
                        value: 'red',
                      },
                    },
                  },
                  style: {
                    margin: 'var(--local-color)',
                    color: 'var(--own-color)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should report CSS variables that are not defined globally or locally', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {},
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
                    color: 'var(--undefined-global)',
                    margin: 'var(--undefined-local)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].details).toEqual({ name: '--undefined-global' })
    expect(problems[1].details).toEqual({ name: '--undefined-local' })
  })

  test('should not report when legacy style variables are used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {},
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
                  'style-variables': [
                    {
                      name: 'legacy-variable',
                      formula: {
                        type: 'value',
                        value: '10px',
                      },
                      category: 'spacing',
                    },
                  ],
                  style: {
                    margin: 'var(--legacy-variable)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report when declared in a style', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {},
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
                    '--declared-in-style': '10px',
                    margin: 'var(--declared-in-style)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report when a legacy theme exists (no propertyDefinitions)', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
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
                    color: 'var(--legacy-theme-variable)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report if CSS variable is defined in any other component or self', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {},
            },
          },
          formulas: {},
          components: {
            componentA: {
              name: 'componentA',
              nodes: {
                root: {
                  tag: 'div',
                  type: 'element',
                  customProperties: {
                    '--variable-in-a': {
                      formula: { type: 'value', value: 'red' },
                    },
                  },
                  attrs: {},
                  style: {
                    color: 'var(--variable-in-a)',
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
            componentB: {
              name: 'componentB',
              nodes: {
                root: {
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'var(--variable-in-a)',
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
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
