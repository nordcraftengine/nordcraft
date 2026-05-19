import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { animatedStyleNotInThemeRule } from './animatedStyleNotInThemeRule'

describe('animatedStyleNotInThemeRule', () => {
  test('should report CSS variables used in animations that are not in the theme', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--theme-var': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A theme variable',
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
                  style: {},
                  events: {},
                  classes: {},
                  children: [],
                  animations: {
                    myAnimation: {
                      k1: {
                        position: 0,
                        key: '--missing-var',
                        value: '0',
                      },
                      k2: {
                        position: 100,
                        key: '--theme-var',
                        value: '1',
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
        rules: [animatedStyleNotInThemeRule],
      }),
    )

    expect(problems).toHaveLength(1)
  })

  test('should not report when all animated CSS variables are in the theme', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--theme-var': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'A theme variable',
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
                  style: {},
                  events: {},
                  classes: {},
                  children: [],
                  animations: {
                    myAnimation: {
                      k1: {
                        position: 0,
                        key: '--theme-var',
                        value: 'blue',
                      },
                      k2: {
                        position: 100,
                        key: '--theme-var',
                        value: 'red',
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
        rules: [animatedStyleNotInThemeRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report regular CSS properties', () => {
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
                  children: [],
                  animations: {
                    myAnimation: {
                      k1: {
                        position: 0,
                        key: 'opacity',
                        value: '0',
                      },
                      k2: {
                        position: 100,
                        key: 'opacity',
                        value: '1',
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
        rules: [animatedStyleNotInThemeRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
