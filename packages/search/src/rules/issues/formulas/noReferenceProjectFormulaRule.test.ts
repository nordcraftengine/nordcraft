import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceProjectFormulaRule } from './noReferenceProjectFormulaRule'

describe('find noReferenceFormulaRule', () => {
  test('should detect unused global formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula': {
              name: 'my-formula',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference project formula')
    expect(problems[0].path).toEqual(['formulas', 'my-formula'])
  })

  test('should detect 1 unused global formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
            },
            'my-formula-2': {
              name: 'my-formula-2',
              arguments: [],
              formula: {
                type: 'function',
                name: 'my-formula-1',
                arguments: [
                  {
                    name: 'my-formula-1',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference project formula')
    expect(problems[0].path).toEqual(['formulas', 'my-formula-2'])
  })

  test('should not detect unused global formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
            },
            'my-formula-2': {
              name: 'my-formula-2',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
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
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'function',
                        name: 'my-formula-2',
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
                'my-formula-3': {
                  name: 'my-formula-3',
                  arguments: [],
                  formula: {
                    type: 'function',
                    name: 'my-formula-1',
                    arguments: [
                      {
                        name: 'my-formula-1',
                        formula: {
                          type: 'value',
                          value: 'value',
                        },
                      },
                    ],
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
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })
  test('should not detect unused global formulas used in API services', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
            },
          },
          components: {},
          services: {
            myService: {
              type: 'supabase',
              name: 'myService',
              baseUrl: {
                type: 'function',
                name: 'my-formula-1',
                arguments: [],
              },
            },
          },
        },
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })
  test('should not detect unused global formulas used in routes', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula-1': {
              name: 'my-formula-1',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
            },
          },
          components: {},
          routes: {
            myRoute: {
              type: 'redirect',
              source: {
                path: [],
                query: {},
              },
              destination: {
                path: {
                  p1: {
                    formula: {
                      type: 'function',
                      name: 'my-formula-1',
                      arguments: [],
                    },
                    index: 0,
                  },
                },
                '@nordcraft/metadata': {
                  comments: null,
                },
              },
            },
          },
        },
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect unused exported global formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'my-formula': {
              name: 'my-formula',
              arguments: [],
              formula: {
                type: 'value',
                value: 'value',
              },
              exported: true,
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceProjectFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})

describe('fix noReferenceFormulaRule', () => {
  test('should remove unused global formulas', () => {
    const projectFiles: ProjectFiles = {
      formulas: {
        'my-formula': {
          name: 'my-formula',
          arguments: [],
          formula: {
            type: 'value',
            value: 'value',
          },
        },
      },
      components: {
        test: {
          name: 'test',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: projectFiles,
      rule: noReferenceProjectFormulaRule,
      fixType: 'delete-project-formula',
    })
    expect(fixedProject.formulas).toEqual({})
  })
})
