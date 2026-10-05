import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { invalidComponentFormulaReferenceRule } from './invalidComponentFormulaReferenceRule'

describe('invalidComponentFormulaReferenceRule', () => {
  test('should report error when @toddle/get references an unknown property on a static component formula', () => {
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
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'apply',
                              name: 'myFormula',
                              arguments: [],
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
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  formula: {
                    type: 'record',
                    entries: [
                      {
                        name: 'knownKey',
                        formula: {
                          type: 'value',
                          value: 'hello',
                        },
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
        rules: [invalidComponentFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    const problem = problems[0] as IssueResult
    expect(problem.code).toBe('invalid component formula reference')
    expect(problem.info.title).toBe('Invalid formula reference')
    expect(problem.info.description).toBe(
      'Property **unknownKey** does not exist on formula **myFormula**.',
    )
    expect(problem.details).toEqual({
      formulaName: 'myFormula',
      invalidKey: 'unknownKey',
    })
  })

  test('should report error when nested path references an unknown property', () => {
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
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'apply',
                              name: 'userFormula',
                              arguments: [],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'array',
                              arguments: [
                                { formula: { type: 'value', value: 'user' } },
                                { formula: { type: 'value', value: 'age' } },
                              ],
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
              formulas: {
                userFormula: {
                  name: 'userFormula',
                  formula: {
                    type: 'record',
                    entries: [
                      {
                        name: 'user',
                        formula: {
                          type: 'record',
                          entries: [
                            {
                              name: 'name',
                              formula: { type: 'value', value: 'Alice' },
                            },
                          ],
                        },
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
        rules: [invalidComponentFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    const problem = problems[0] as IssueResult
    expect(problem.code).toBe('invalid component formula reference')
    expect(problem.details).toEqual({
      formulaName: 'userFormula',
      invalidKey: 'age',
    })
  })

  test('should not report error when property exists on static component formula', () => {
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
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'apply',
                              name: 'myFormula',
                              arguments: [],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'value',
                              value: 'knownKey',
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
              formulas: {
                myFormula: {
                  name: 'myFormula',
                  formula: {
                    type: 'record',
                    entries: [
                      {
                        name: 'knownKey',
                        formula: {
                          type: 'value',
                          value: 'hello',
                        },
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
        rules: [invalidComponentFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report error when component formula is non-static', () => {
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
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'apply',
                              name: 'dynamicFormula',
                              arguments: [],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'value',
                              value: 'someKey',
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
              formulas: {
                dynamicFormula: {
                  name: 'dynamicFormula',
                  formula: {
                    type: 'path',
                    path: ['Variables', 'myVar'],
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {
                myVar: {
                  initialValue: { type: 'value', value: {} },
                },
              },
            },
          },
        },
        rules: [invalidComponentFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report error when Path formula is non-static', () => {
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
                        name: '@toddle/get',
                        arguments: [
                          {
                            name: 'Object',
                            formula: {
                              type: 'apply',
                              name: 'staticFormula',
                              arguments: [],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'path',
                              path: ['Variables', 'dynamicKey'],
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
              formulas: {
                staticFormula: {
                  name: 'staticFormula',
                  formula: {
                    type: 'value',
                    value: { a: 1 },
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidComponentFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
