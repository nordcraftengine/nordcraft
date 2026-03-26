import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownRepeatItemFormulaRule } from './unknownRepeatItemFormulaRule'

describe('unknownRepeatItemFormulaRule', () => {
  test('should find unknown repeat item formulas', () => {
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
                    path: ['ListItem', 'Item'],
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
        rules: [unknownRepeatItemFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown repeat item formula')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      '84CPDAaFJdwh8Vaimehky',
      'value',
    ])
  })
  test('should find unknown repeat item outside of nodes', () => {
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
              onLoad: {
                trigger: 'load',
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
                          type: 'function',
                          name: '@toddle/concatenate',
                          arguments: [
                            {
                              name: '0',
                              formula: { type: 'value', value: 'Hello' },
                              type: { type: 'Array \\| String \\| Object' },
                            },
                            {
                              name: '0',
                              formula: {
                                type: 'path',
                                path: ['ListItem', 'Item'],
                              },
                              type: { type: 'Array \\| String \\| Object' },
                            },
                          ],
                          variableArguments: true,
                          display_name: 'Concatenate',
                        },
                        description: 'The data you want to log to the console.',
                      },
                    ],
                    description: 'Log a message to the browser console.',
                  },
                ],
              },
            },
          },
        },
        rules: [unknownRepeatItemFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown repeat item formula')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '0',
      'arguments',
      '1',
      'formula',
      'arguments',
      1,
      'formula',
    ])
  })
  test('should find unknown repeat item outside of a component', () => {
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
                      path: ['ListItem', 'Item'],
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
        rules: [unknownRepeatItemFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown repeat item formula')
    expect(problems[0].path).toEqual([
      'formulas',
      'myFormula',
      'formula',
      'arguments',
      1,
      'formula',
    ])
  })
  test('should ignore known repeat item formulas', () => {
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
                    path: ['ListItem', 'Item'],
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
        rules: [unknownRepeatItemFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
