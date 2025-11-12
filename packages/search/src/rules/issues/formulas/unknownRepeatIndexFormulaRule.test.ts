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
  test('should find unknown repeat index formulas outside of nodes', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              workflows: {
                myWorkflow: {
                  name: 'myWorkflow',
                  parameters: [],
                  actions: [
                    {
                      name: '@toddle/logToConsole',
                      group: 'debugging',
                      label: 'Log to console',
                      arguments: [
                        {
                          name: 'Label',
                          formula: { type: 'value', value: '' },
                          description: 'A label for the message.',
                        },
                        {
                          name: 'Data',
                          type: { type: 'Any' },
                          formula: {
                            type: 'path',
                            path: ['ListItem', 'Index'],
                          },
                          description:
                            'The data you want to log to the console.',
                        },
                      ],
                      description: 'Log a message to the browser console.',
                    },
                  ],
                },
              },
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
      'workflows',
      'myWorkflow',
      'actions',
      0,
      'arguments',
      '1',
      'formula',
    ])
  })
  test('should find unknown repeat index outside of a component', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            myFormula: {
              name: 'myFormula',
              formula: {
                name: '@toddle/concatenate',
                type: 'function',
                arguments: [
                  {
                    name: '0',
                    type: {
                      type: 'Array \\| String \\| Object',
                    },
                    formula: {
                      path: ['Args', 'First'],
                      type: 'path',
                    },
                  },
                  {
                    name: '0',
                    type: {
                      type: 'Array \\| String \\| Object',
                    },
                    formula: {
                      type: 'path',
                      path: ['ListItem', 'Index'],
                    },
                  },
                ],
                display_name: 'Concatenate',
                variableArguments: true,
              },
              version: 2,
              arguments: [
                {
                  name: 'First',
                  formula: null,
                  testValue: 'sdfsdf',
                },
              ],
              description: 'sdfsdfsdf',
            },
          },
          components: {},
        },
        rules: [unknownRepeatIndexFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown repeat index formula')
    expect(problems[0].path).toEqual([
      'formulas',
      'myFormula',
      'formula',
      'arguments',
      1,
      'formula',
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
