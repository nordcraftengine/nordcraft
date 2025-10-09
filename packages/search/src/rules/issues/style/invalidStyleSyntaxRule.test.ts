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
  test.only('should find class based invalid style syntax', () => {
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
                    '}\n\n/* Arrow navigation buttons */\n.vanilla-calendar .vanilla-calendar-arrow {\n    color':
                      '#ecf0f1',
                    '/* White text */\n}\n\n/* Hover state for day buttons */\n.vanilla-calendar .vanilla-calendar-day__btn':
                      'hover {\nbackground-color: #08365b',
                    '}\n\n/* All day buttons - background and font color */\n.vanilla-calendar .vanilla-calendar-day__btn {\n    background-color':
                      'transparent',
                    '/* Inherits from parent */\n}\n\n/* Weekday labels - font color */\n.vanilla-calendar .vanilla-calendar-week__day {\n    color':
                      '#00a7e1',
                    '/* Main calendar container - background and font family */.vanilla-calendar.vanilla-calendar_default {    background-color':
                      'transparent',
                    '/* Custom font */}/* Header section - background and text color */.vanilla-calendar .vanilla-calendar-header {    background-color':
                      '#ffffff00',
                    "/* Dimmed gray */\n}\n\n/* Today's date - special coloring */\n.vanilla-calendar .vanilla-calendar-day__btn_today {\n    background-color":
                      '#08365b80',
                    '/* White text */\n}\n\n/* Selected date - distinctive colors */\n.vanilla-calendar .vanilla-calendar-day__btn_selected {\n    background-color':
                      '#00a7e1',
                    '/* Light gray text */}/* Month and Year buttons - font color */.vanilla-calendar .vanilla-calendar-month,.vanilla-calendar .vanilla-calendar-year {    color':
                      '#ffffff',
                    '}\n\n/* Previous/next month days - dimmed color */\n.vanilla-calendar .vanilla-calendar-day__btn_prev,\n.vanilla-calendar .vanilla-calendar-day__btn_next {\n    color':
                      '#7f8c8d',
                  },
                  events: {},
                  repeat: null,
                  package: 'vanilla',
                  children: [
                    '6pb4ELucFmm1GwGbVfLc7',
                    '8vrF3RhVEhajiB-f-sJ7S',
                    'R-hFhzdREjkUXdlFGbpT9',
                  ],
                  variants: [],
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
              onLoad: null,
              formulas: {},
              variables: {},
              attributes: {},
            },
          },
        },
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(12)
    expect(problems[0].code).toBe('invalid style syntax')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      '9HN6AOP6F6ofzHhVh089X',
      'style',
      '',
    ])
    const properties = problems.map((p) => p.details.property)
    expect(properties).toMatchInlineSnapshot(`
      [
        "",
        "}",
        
      "}

      /* Arrow navigation buttons */
      .vanilla-calendar .vanilla-calendar-arrow {
          color"
      ,
        
      "/* White text */
      }

      /* Hover state for day buttons */
      .vanilla-calendar .vanilla-calendar-day__btn"
      ,
        
      "}

      /* All day buttons - background and font color */
      .vanilla-calendar .vanilla-calendar-day__btn {
          background-color"
      ,
        
      "/* Inherits from parent */
      }

      /* Weekday labels - font color */
      .vanilla-calendar .vanilla-calendar-week__day {
          color"
      ,
        "/* Main calendar container - background and font family */.vanilla-calendar.vanilla-calendar_default {    background-color",
        "/* Custom font */}/* Header section - background and text color */.vanilla-calendar .vanilla-calendar-header {    background-color",
        
      "/* Dimmed gray */
      }

      /* Today's date - special coloring */
      .vanilla-calendar .vanilla-calendar-day__btn_today {
          background-color"
      ,
        
      "/* White text */
      }

      /* Selected date - distinctive colors */
      .vanilla-calendar .vanilla-calendar-day__btn_selected {
          background-color"
      ,
        "/* Light gray text */}/* Month and Year buttons - font color */.vanilla-calendar .vanilla-calendar-month,.vanilla-calendar .vanilla-calendar-year {    color",
        
      "}

      /* Previous/next month days - dimmed color */
      .vanilla-calendar .vanilla-calendar-day__btn_prev,
      .vanilla-calendar .vanilla-calendar-day__btn_next {
          color"
      ,
      ]
    `)
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
})
