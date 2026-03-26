import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'

describe('find invalidStyleSyntaxRule', () => {
  test('should find invalid style syntax', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'ul',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: '8px',
                    width: '100%',
                    'max-width': 'calc(NOT VALID',
                    height: '/* 100px */ 22px',
                    '{': '100px',
                    'border-width': '--my-var',
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('invalid style syntax')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'style',
      'max-width',
    ])
    expect(problems[0].details.property).toBe('max-width')
    expect(problems[1].details.property).toBe('{')
  })
  test('should find class based invalid style syntax', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              apis: {},
              name: 'test',
              nodes: {
                root: {
                  tag: 'div',
                  type: 'element',
                  attrs: {},
                  style: {
                    flex: '0',
                    width: 'fit-content',
                    background:
                      'linear-gradient(to bottom right, var(--Lighter-Navy) 0%, var(--Dark-Navy) 100%) scroll padding-box border-box repeat repeat 0% 0% / auto',
                    'box-shadow': '0px 2px 40px 10px var(--Dark-Navy)',
                    'border-color': 'var(--Lighter-Navy)',
                    'border-style': 'solid',
                    'border-width': '2px',
                    'border-top-left-radius': '6px',
                    'border-top-right-radius': '6px',
                    'border-bottom-left-radius': '6px',
                    'border-bottom-right-radius': '6px',
                  },
                  events: {},
                  classes: {},
                  children: ['9HN6AOP6F6ofzHhVh089X'],
                  'style-variables': [],
                },
                '6pb4ELucFmm1GwGbVfLc7': {
                  type: 'text',
                  value: {
                    type: 'value',
                    value: '',
                  },
                },
                '8vrF3RhVEhajiB-f-sJ7S': {
                  type: 'text',
                  value: {
                    type: 'value',
                    value: '#00a7e1',
                  },
                },
                '9HN6AOP6F6ofzHhVh089X': {
                  name: 'calendar',
                  type: 'component',
                  attrs: {},
                  style: {
                    '': '',
                    '}': '',
                    flex: '0',
                    color: '#ffffff',
                    '/* Red background */    color': '#ffffff !important',
                    '/* Blue background */    color': '#ffffff',
                    '/* Muted gray */    font-family': '#00a7e1',
                    '/* White text */\n    font-family': 'inherit',
                    '/* Slightly darker header */    color': '#00a7e1',
                    '/* Dark blue-gray background */    font-family':
                      "'Red Hat Display'",
                    '/* Light gray for regular days */\n    font-family':
                      'inherit',
                    '}\n\n/* Arrow navigation buttons */\n.my-class .my-other-class {\n    color':
                      '#ecf0f1',
                    '/* White text */\n}\n\n/* Hover state for my buttons */\n.my-class .my-other-class-my__btn':
                      'hover {\nbackground-color: #08365b',
                  },
                  events: {},
                  package: 'vanilla',
                  children: [
                    '6pb4ELucFmm1GwGbVfLc7',
                    '8vrF3RhVEhajiB-f-sJ7S',
                    'R-hFhzdREjkUXdlFGbpT9',
                  ],
                  variants: [
                    {
                      style: {
                        '': '',
                        '/* Dimmed gray */\n}\n\n/* My special coloring */\n.my-class .my-class-my__btn_special {\nbackground-color':
                          '#ffffff',
                      },
                      hover: true,
                      breakpoint: 'small',
                    },
                  ],
                },
                'R-hFhzdREjkUXdlFGbpT9': {
                  type: 'text',
                  value: {
                    type: 'value',
                    value: '#ffffff00',
                  },
                },
              },
              events: [],
              formulas: {},
              variables: {},
              attributes: {},
            },
          },
        },
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(6)
    expect(problems[0].code).toBe('invalid style syntax')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      '9HN6AOP6F6ofzHhVh089X',
      'style',
      '',
    ])
    expect(problems[4].path).toEqual([
      'components',
      'test',
      'nodes',
      '9HN6AOP6F6ofzHhVh089X',
      'variants',
      0,
      'style',
      '',
    ])
    const invalidStyleProperties = problems
      .filter((p) => !p.path.includes('variants'))
      .map((p) => p.details.property)
    expect(invalidStyleProperties).toEqual([
      '',
      '}',
      '}\n\n/* Arrow navigation buttons */\n.my-class .my-other-class {\n    color',
      '/* White text */\n}\n\n/* Hover state for my buttons */\n.my-class .my-other-class-my__btn',
    ])
    const invalidVariantProperties = problems
      .filter((p) => p.path.includes('variants'))
      .map((p) => p.details.property)
    expect(invalidVariantProperties).toEqual([
      '',
      '/* Dimmed gray */\n}\n\n/* My special coloring */\n.my-class .my-class-my__btn_special {\nbackground-color',
    ])
  })
})

describe('find formulas in style syntax', () => {
  test('should find Variables. references in style syntax', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    transform: 'translateX(Variables.offsetX)',
                    width: '100px',
                    height: 'Variables.height',
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toMatchObject([
      {
        code: 'invalid style syntax',
        path: ['components', 'test', 'nodes', 'root', 'style', 'transform'],
        details: { property: 'transform' },
      },
      {
        code: 'invalid style syntax',
        path: ['components', 'test', 'nodes', 'root', 'style', 'height'],
        details: { property: 'height' },
      },
    ])
  })

  test('should find Formulas., Event., Attributes., Apis., Parameters., ListItem., URLParameters. references', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    color: 'Formulas.getColor()',
                    top: 'Event.clientY',
                    margin: 'Attributes.margin',
                    background: 'Apis.getBackground()',
                    fontSize: 'Parameters.size',
                    backgroundColor: 'ListItem.color',
                    width: 'URLParameters.width',
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(7)
    expect(problems.map((p) => p.details.property)).toEqual([
      'color',
      'top',
      'margin',
      'background',
      'fontSize',
      'backgroundColor',
      'width',
    ])
  })

  test('should not find formulas in valid CSS values', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    width: '100px',
                    height: '50%',
                    color: '#ffffff',
                    backgroundColor: 'var(--my-var)',
                    transform: 'translateX(10px)',
                    margin: '10px 20px',
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not find formulas in numeric style values', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    opacity: 0.5,
                    zIndex: 10,
                    flex: 1,
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should find formulas in variant styles', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    width: '100px',
                  },
                  events: {},
                  classes: {},
                  children: [],
                  variants: [
                    {
                      style: {
                        transform: 'translateX(Variables.offsetX)',
                        color: 'Event.color',
                      },
                      hover: true,
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toMatchObject([
      {
        code: 'invalid style syntax',
        path: [
          'components',
          'test',
          'nodes',
          'root',
          'variants',
          0,
          'style',
          'transform',
        ],
        details: { property: 'transform' },
      },
      {
        code: 'invalid style syntax',
        path: [
          'components',
          'test',
          'nodes',
          'root',
          'variants',
          0,
          'style',
          'color',
        ],
        details: { property: 'color' },
      },
    ])
  })

  test('should handle case-insensitive matching for formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    width: 'VARIABLES.offsetX',
                    height: 'variables.height',
                    color: 'FORMULAS.getColor()',
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
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(3)
    expect(problems.map((p) => p.details.property)).toEqual([
      'width',
      'height',
      'color',
    ])
  })
})

describe('fix invalidStyleSyntaxRule', () => {
  test('should remove an invalid style property', () => {
    const files: ProjectFiles = {
      formulas: {},
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              tag: 'ul',
              type: 'element',
              attrs: {},
              style: {
                gap: '8px',
                width: '100%',
                'max-width': 'calc(NOT VALID',
                height: '/* 100px */ 22px',
                '{': '100px',
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
    const fixedFiles = fixProject({
      files,
      rule: invalidStyleSyntaxRule,
      fixType: 'delete-style-property',
    })
    expect((fixedFiles.components.test!.nodes?.root as ElementNodeModel).style)
      .toMatchInlineSnapshot(`
      {
        "gap": "8px",
        "height": "/* 100px */ 22px",
        "width": "100%",
      }
    `)
  })
  test('should remove a style property with formula syntax', () => {
    const files: ProjectFiles = {
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
                width: '100px',
                transform: 'translateX(Variables.offsetX)',
                height: '50px',
                color: 'Variables.color',
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
    const fixedFiles = fixProject({
      files,
      rule: invalidStyleSyntaxRule,
      fixType: 'delete-style-property',
    })
    expect((fixedFiles.components.test!.nodes?.root as ElementNodeModel).style)
      .toMatchInlineSnapshot(`
      {
        "height": "50px",
        "width": "100px",
      }
    `)
  })

  test('should remove an invalid style variant style property', () => {
    const files: ProjectFiles = {
      formulas: {},
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              tag: 'ul',
              type: 'element',
              attrs: {},
              style: {},
              events: {},
              classes: {},
              children: [],
              variants: [
                {
                  style: {
                    gap: '8px',
                    width: '100%',
                    'max-width': 'calc(NOT VALID',
                    height: '/* 100px */ 22px',
                    '{': '100px',
                  },
                  breakpoint: 'small',
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
    }
    const fixedFiles = fixProject({
      files,
      rule: invalidStyleSyntaxRule,
      fixType: 'delete-style-property',
    })
    expect(
      (fixedFiles.components.test!.nodes?.root as ElementNodeModel)
        .variants?.[0].style,
    ).toMatchInlineSnapshot(`
      {
        "gap": "8px",
        "height": "/* 100px */ 22px",
        "width": "100%",
      }
    `)
  })

  test('should remove a variant style property with formula syntax', () => {
    const files: ProjectFiles = {
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
              variants: [
                {
                  style: {
                    width: '100px',
                    transform: 'translateX(Variables.offsetX)',
                    height: '50px',
                    color: 'Event.color',
                  },
                  hover: true,
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
    }
    const fixedFiles = fixProject({
      files,
      rule: invalidStyleSyntaxRule,
      fixType: 'delete-style-property',
    })
    expect(
      (fixedFiles.components.test!.nodes?.root as ElementNodeModel)
        .variants?.[0].style,
    ).toMatchInlineSnapshot(`
      {
        "height": "50px",
        "width": "100px",
      }
    `)
  })
})
