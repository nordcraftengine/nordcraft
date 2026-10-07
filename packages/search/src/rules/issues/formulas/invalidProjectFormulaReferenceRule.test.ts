import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { invalidProjectFormulaReferenceRule } from './invalidProjectFormulaReferenceRule'

describe('invalidProjectFormulaReferenceRule', () => {
  test('should report error when @toddle/get references an unknown property on a static project formula', () => {
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
                              type: 'function',
                              name: 'myGlobalFormula',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
          formulas: {
            myGlobalFormula: {
              name: 'myGlobalFormula',
              arguments: [],
              formula: {
                type: 'record',
                entries: [
                  {
                    name: 'knownKey',
                    formula: {
                      type: 'value',
                      value: 'world',
                    },
                  },
                ],
              },
            },
          },
        },
        rules: [invalidProjectFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    const problem = problems[0] as IssueResult
    expect(problem.code).toBe('invalid project formula reference')
    expect(problem.info.title).toBe('Invalid project formula reference')
    expect(problem.info.description).toBe(
      'Property **unknownKey** does not exist on project formula **myGlobalFormula**.',
    )
    expect(problems[0].details).toEqual({
      formulaName: 'myGlobalFormula',
      invalidKey: 'unknownKey',
    })
  })

  test('should report error for package-level project formulas with unknown key', () => {
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
                              type: 'function',
                              package: 'my-package',
                              name: 'pkgFormula',
                              arguments: [],
                            },
                          },
                          {
                            name: 'Path',
                            formula: {
                              type: 'value',
                              value: 'missingProp',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
          formulas: {},
          packages: {
            'my-package': {
              manifest: {
                name: 'my-package',
                commit: 'abcdef1234567890',
              },
              components: {},
              actions: {},
              formulas: {
                pkgFormula: {
                  name: 'pkgFormula',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: { existingProp: 123 },
                  },
                },
              },
            },
          },
        },
        rules: [invalidProjectFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    const problem = problems[0] as IssueResult
    expect(problem.code).toBe('invalid project formula reference')
    expect(problem.details).toEqual({
      formulaName: 'pkgFormula',
      invalidKey: 'missingProp',
    })
  })

  test('should not report error when property exists on static project formula', () => {
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
                              type: 'function',
                              name: 'myGlobalFormula',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
          formulas: {
            myGlobalFormula: {
              name: 'myGlobalFormula',
              arguments: [],
              formula: {
                type: 'value',
                value: { knownKey: 'world' },
              },
            },
          },
        },
        rules: [invalidProjectFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report error when project formula is non-static', () => {
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
                              type: 'function',
                              name: 'dynamicGlobalFormula',
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
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
          formulas: {
            dynamicGlobalFormula: {
              name: 'dynamicGlobalFormula',
              arguments: [],
              formula: {
                type: 'function',
                name: '@toddle/now',
                arguments: [],
              },
            },
          },
        },
        rules: [invalidProjectFormulaReferenceRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
