import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownRepeatIndexFormulaRule } from './unknownRepeatIndexFormulaRule'

describe('unknownRepeatIndexFormulaRule', () => {
  test('should find unknown repeat index formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                '84CPDAaFJdwh8Vaimehky': {
                  type: 'text',
                  value: {
                    type: 'path',
                    path: ['ListItem', 'Index'],
                  },
                },
                'Z95Ucsbip-YWbTmC38-vG': {
                  tag: 'li',
                  type: 'element',
                  attrs: {},
                  style: {
                    'font-weight': 'var(--font-weight-regular)',
                    'justify-content': 'center',
                  },
                  events: {},
                  classes: {},
                  children: ['84CPDAaFJdwh8Vaimehky'],
                },
                root: {
                  tag: 'ul',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: '8px',
                    width: '100%',
                  },
                  events: {},
                  classes: {},
                  children: ['Z95Ucsbip-YWbTmC38-vG'],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownRepeatIndexFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown repeat index formula')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      '84CPDAaFJdwh8Vaimehky',
      'value',
    ])
  })
  test('should ignore known repeat index formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                '84CPDAaFJdwh8Vaimehky': {
                  type: 'text',
                  value: {
                    type: 'path',
                    path: ['ListItem', 'Index'],
                  },
                },
                'Z95Ucsbip-YWbTmC38-vG': {
                  tag: 'li',
                  type: 'element',
                  attrs: {},
                  style: {
                    'font-weight': 'var(--font-weight-regular)',
                    'justify-content': 'center',
                  },
                  events: {},
                  classes: {},
                  children: ['84CPDAaFJdwh8Vaimehky'],
                  repeat: {
                    type: 'array',
                    arguments: [
                      {
                        formula: {
                          type: 'value',
                          value: 0,
                        },
                      },
                      {
                        formula: {
                          type: 'value',
                          value: 1,
                        },
                      },
                    ],
                  },
                },
                root: {
                  tag: 'ul',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: '8px',
                    width: '100%',
                  },
                  events: {},
                  classes: {},
                  children: ['Z95Ucsbip-YWbTmC38-vG'],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownRepeatIndexFormulaRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
