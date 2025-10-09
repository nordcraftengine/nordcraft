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
    expect((fixedFiles.components.test!.nodes.root as ElementNodeModel).style)
      .toMatchInlineSnapshot(`
      {
        "gap": "8px",
        "height": "/* 100px */ 22px",
        "width": "100%",
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
      (fixedFiles.components.test!.nodes.root as ElementNodeModel).variants?.[0]
        .style,
    ).toMatchInlineSnapshot(`
      {
        "gap": "8px",
        "height": "/* 100px */ 22px",
        "width": "100%",
      }
    `)
  })
})
