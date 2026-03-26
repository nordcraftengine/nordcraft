import type { ProjectFiles } from '@nordcraft/ssr/dist/src/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
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

  test('should report problem if local variable is used in parent but only defined in child', () => {
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
                    color: 'var(--child-only-variable)',
                  },
                  events: {},
                  classes: {},
                  children: ['child'],
                },
                child: {
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  customProperties: {
                    '--child-only-variable': {
                      formula: {
                        type: 'value',
                        value: 'red',
                      },
                    },
                  },
                  style: {},
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

    expect(problems).toHaveLength(1)
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

  test('fix should add variable to theme', () => {
    const files: ProjectFiles = {
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
                color: 'var(--new-theme-variable)',
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
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [unknownCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)

    const fixedProject = fixProject({
      files,
      rule: unknownCSSVariableRule,
      fixType: 'add-to-theme',
    })

    expect(
      Object.keys(fixedProject.themes?.Default.propertyDefinitions ?? {}),
    ).toHaveLength(1)
    expect(fixedProject.themes?.Default.propertyDefinitions).toHaveProperty(
      '--new-theme-variable',
    )
    expect(
      fixedProject.themes?.Default.propertyDefinitions?.[
        '--new-theme-variable'
      ],
    ).toEqual({
      syntax: {
        type: 'primitive',
        name: '*',
      },
      inherits: true,
      initialValue: '',
      values: {},
      description: '',
    })
  })
})
