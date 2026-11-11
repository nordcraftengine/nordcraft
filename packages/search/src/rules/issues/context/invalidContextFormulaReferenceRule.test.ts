import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { invalidContextFormulaReferenceRule } from './invalidContextFormulaReferenceRule'

describe('invalidContextFormulaReferenceRule', () => {
  test('should report error when @toddle/get references an unknown property on a static exported context formula', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'function',
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'path',
                              path: ['Contexts', 'provider', 'themeColors'],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'value',
                              value: 'unknownKey',
                            },
                          },
                        ],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['themeColors'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                themeColors: {
                  name: 'themeColors',
                  exposeInContext: true,
                  formula: {
                    type: 'record',
                    entries: [
                      {
                        name: 'primary',
                        formula: { type: 'value', value: '#ff0000' },
                      },
                    ],
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    const problem = problems[0] as IssueResult
    expect(problem.code).toBe('invalid context formula reference')
    expect(problem.info.title).toBe('Invalid context formula reference')
    expect(problem.info.description).toBe(
      'Property **unknownKey** does not exist on context formula **themeColors**.',
    )
    expect(problem.details).toEqual({
      providerName: 'provider',
      formulaName: 'themeColors',
      invalidKey: 'unknownKey',
    })
  })

  test('should report error when a path formula directly references an unknown property on a static exported context formula', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: [
                          'Contexts',
                          'provider',
                          'themeColors',
                          'unknownKey',
                        ],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['themeColors'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                themeColors: {
                  name: 'themeColors',
                  exposeInContext: true,
                  formula: {
                    type: 'value',
                    value: { primary: '#ff0000' },
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect((problems[0] as IssueResult).code).toBe(
      'invalid context formula reference',
    )
    expect(problems[0].details).toEqual({
      providerName: 'provider',
      formulaName: 'themeColors',
      invalidKey: 'unknownKey',
    })
  })

  test('should not report error when property exists on static context formula', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: [
                          'Contexts',
                          'provider',
                          'themeColors',
                          'primary',
                        ],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['themeColors'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                themeColors: {
                  name: 'themeColors',
                  exposeInContext: true,
                  formula: {
                    type: 'value',
                    value: { primary: '#ff0000' },
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report error when context formula is not exported', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: [
                          'Contexts',
                          'provider',
                          'themeColors',
                          'unknownKey',
                        ],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['themeColors'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                themeColors: {
                  name: 'themeColors',
                  exposeInContext: false,
                  formula: {
                    type: 'value',
                    value: { primary: '#ff0000' },
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report error when context formula is non-static', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: [
                          'Contexts',
                          'provider',
                          'dynamicFormula',
                          'unknownKey',
                        ],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['dynamicFormula'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                dynamicFormula: {
                  name: 'dynamicFormula',
                  exposeInContext: true,
                  formula: {
                    type: 'path',
                    path: ['Variables', 'someVar'],
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {
                someVar: {
                  initialValue: { type: 'value', value: {} },
                },
              },
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should allow @toddle/get string indexing on a static context formula while rejecting direct path string indexing', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'valid-get': {
                      formula: {
                        type: 'function',
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'path',
                              path: ['Contexts', 'provider', 'greeting'],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'value',
                              value: 1,
                            },
                          },
                        ],
                      },
                    },
                    'invalid-path': {
                      formula: {
                        type: 'path',
                        path: ['Contexts', 'provider', 'greeting', 1],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              contexts: {
                provider: {
                  formulas: ['greeting'],
                  workflows: [],
                  componentName: 'provider',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {
                greeting: {
                  name: 'greeting',
                  exposeInContext: true,
                  formula: {
                    type: 'value',
                    value: 'hello',
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidContextFormulaReferenceRule],
      }),
    )

    expect(problems).toEqual([
      {
        code: 'invalid context formula reference',
        path: [
          'components',
          'consumer',
          'nodes',
          'root',
          'classes',
          'invalid-path',
          'formula',
        ],
        level: 'error',
        category: 'Unknown Reference',
        info: {
          title: 'Invalid context formula reference',
          description:
            'Property **1** does not exist on context formula **greeting**.',
        },
        details: {
          providerName: 'provider',
          formulaName: 'greeting',
          invalidKey: 1,
        },
      },
    ])
  })
})
