import type { ToddleFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { legacyFormulaRule } from './legacyFormulaRule'

describe('detect legacyFormula', () => {
  test('should detect legacy formulas used in global formula', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            ADD: {
              name: 'ADD',
              arguments: [],
              handler: '',
            },
            EQ: {
              name: 'EQ',
              arguments: [],
              handler: '',
            },
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'function',
                name: 'ADD',
                arguments: [
                  {
                    name: 'arg',
                    formula: {
                      type: 'value',
                      value: 'value',
                    },
                  },
                ],
              },
            },
            'my-formula-2': {
              name: 'my-formula-2',
              arguments: [],
              formula: {
                type: 'function',
                name: 'EQ',
                arguments: [
                  {
                    name: 'arg',
                    formula: {
                      type: 'value',
                      value: 'value',
                    },
                  },
                ],
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyFormulaRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('legacy formula')
    expect(problems[0].details).toEqual({ name: 'ADD' })
    expect(problems[1].code).toBe('legacy formula')
    expect(problems[1].details).toEqual({ name: 'EQ' })
  })

  test('should detect legacy formulas used in global formula as argument', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            ADD: {
              name: 'ADD',
              arguments: [],
              handler: '',
            },
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'function',
                name: 'my-formula-2',
                arguments: [
                  {
                    name: '0',
                    formula: {
                      type: 'function',
                      name: 'ADD',
                      arguments: [
                        {
                          name: '1',
                          formula: {
                            type: 'value',
                            value: 'value',
                          },
                        },
                        {
                          name: '2',
                          formula: {
                            type: 'value',
                            value: 'value',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('legacy formula')
    expect(problems[0].details).toEqual({ name: 'ADD' })
  })

  test('should detect legacy formulas used in the component', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            ADD: {
              name: 'ADD',
              arguments: [],
              handler: '',
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'function',
                        name: 'ADD',
                        arguments: [],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {
                'my-formula-2': {
                  name: 'my-formula-2',
                  arguments: [],
                  formula: {
                    type: 'function',
                    name: 'ADD',
                    arguments: [],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyFormulaRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('legacy formula')
    expect(problems[1].code).toBe('legacy formula')
    expect(problems[0].details).toEqual({ name: 'ADD' })
    expect(problems[1].details).toEqual({ name: 'ADD' })
  })

  test('should not detect legacy formulas 1', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            APPLY_FORMULA: {
              name: 'APPLY_FORMULA',
              arguments: [],
              handler: '',
            },
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'function',
                name: 'APPLY_FORMULA',
                arguments: [
                  {
                    name: 'arg',
                    formula: {
                      type: 'value',
                      value: 'value',
                    },
                  },
                ],
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect legacy formulas 2', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'function',
                        name: 'Add',
                        arguments: [],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {
                known: {
                  name: 'known',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
describe('fix legacyFormula', () => {
  test('should fix the legacy AND formula', () => {
    const files: ProjectFiles = {
      formulas: {
        AND: {
          name: 'AND',
          arguments: [],
          handler: '',
        },
        'my-formula-1': {
          name: 'my-formula-1',
          arguments: [],
          formula: {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              {
                name: '0',
                formula: {
                  type: 'function',
                  name: 'AND',
                  arguments: [
                    {
                      name: 'Condition',
                      formula: { type: 'value', value: true },
                    },
                    {
                      name: 'Condition',
                      formula: { type: 'value', value: true },
                    },
                  ],
                  variableArguments: true,
                },
              },
            ],
            variableArguments: true,
            display_name: 'Concatenate',
          },
        },
      },
      components: {},
    }
    const fixedProject = fixProject({
      files,
      rule: legacyFormulaRule,
      fixType: 'replace-formula',
    })

    expect(
      (fixedProject.formulas?.['my-formula-1'] as ToddleFormula).formula,
    ).toEqual({
      type: 'function',
      name: '@toddle/concatenate',
      arguments: [
        {
          name: '0',
          formula: {
            type: 'and',
            arguments: [
              {
                formula: { type: 'value', value: true },
              },
              {
                formula: { type: 'value', value: true },
              },
            ],
            variableArguments: true,
          },
        },
      ],
      variableArguments: true,
      display_name: 'Concatenate',
    } as any)
  })
  test('should fix the legacy IF formula', () => {
    const files: ProjectFiles = {
      formulas: {
        IF: {
          name: 'IF',
          arguments: [],
          handler: '',
        },
      },
      components: {
        'project-sidebar-item': {
          apis: {},
          name: 'project-sidebar-item',
          nodes: {},
          events: [],
          onLoad: {
            actions: [],
            trigger: 'Load',
          },
          contexts: {
            EditorPage: {
              formulas: ['XK0T8tQWA0YhkfDUzqu-h'],
              workflows: ['sNo0Ya'],
              componentName: 'EditorPage',
            },
          },
          formulas: {
            p_Z1PzOcDop79KGafQ7Lm: {
              name: 'Preview domain',
              formula: {
                name: 'IF',
                type: 'function',
                arguments: [
                  {
                    name: 'If',
                    formula: {
                      name: '@toddle/equals',
                      type: 'function',
                      arguments: [
                        {
                          name: 'First',
                          formula: {
                            path: ['Attributes', 'branch-name'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Second',
                          formula: {
                            type: 'value',
                            value: 'main',
                          },
                        },
                      ],
                      display_name: 'Equals',
                    },
                  },
                  {
                    name: 'Then',
                    formula: {
                      name: '@toddle/concatenate',
                      type: 'function',
                      arguments: [
                        {
                          name: 'Items',
                          formula: {
                            type: 'value',
                            value: 'https://',
                          },
                        },
                        {
                          formula: {
                            path: ['Attributes', 'project-name'],
                            type: 'path',
                          },
                        },
                        {
                          formula: {
                            type: 'value',
                            value: '.toddle.site',
                          },
                        },
                      ],
                      display_name: 'Concatenate',
                      variableArguments: true,
                    },
                  },
                  {
                    name: 'Else',
                    formula: {
                      name: '@toddle/concatenate',
                      type: 'function',
                      arguments: [
                        {
                          formula: {
                            type: 'value',
                            value: 'https://',
                          },
                        },
                        {
                          formula: {
                            path: ['Attributes', 'branch-name'],
                            type: 'path',
                          },
                        },
                        {
                          formula: {
                            type: 'value',
                            value: '-',
                          },
                        },
                        {
                          formula: {
                            path: ['Attributes', 'project-name'],
                            type: 'path',
                          },
                        },
                        {
                          formula: {
                            type: 'value',
                            value: '.toddle.site',
                          },
                        },
                      ],
                      display_name: 'Concatenate',
                      variableArguments: true,
                    },
                  },
                ],
              },
              memoize: false,
              arguments: [],
            },
          },
          variables: {},
          workflows: {},
          attributes: {},
        },
      },
    }
    const fixedProject = fixProject({
      files,
      rule: legacyFormulaRule,
      fixType: 'replace-formula',
      pathsToVisit: [
        [
          'components',
          'project-sidebar-item',
          'formulas',
          'p_Z1PzOcDop79KGafQ7Lm',
          'formula',
        ],
      ],
      useExactPaths: true,
    })

    const updatedFormula = (
      fixedProject.components['project-sidebar-item']?.formulas?.[
        'p_Z1PzOcDop79KGafQ7Lm'
      ] as any
    )?.formula
    expect(updatedFormula.type).toEqual('switch')
  })
})
