import { HeadTagTypes } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noReferenceComponentFormulaRule } from './noReferenceComponentFormulaRule'

describe('noReferenceComponentFormulaRule', () => {
  test('should detect component formulas with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [
                      {
                        name: 'Input',
                        formula: { type: 'value', value: 5 },
                      },
                    ],
                  },
                  arguments: [],
                  memoize: false,
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {
                'my-variable': {
                  initialValue: { type: 'value', value: 5 },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component formula')
    expect(problems[0].path).toEqual([
      'components',
      'page',
      'formulas',
      'my-formula',
    ])
  })

  test('should not detect component formulas with references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [
                      {
                        name: 'Input',
                        formula: { type: 'value', value: 5 },
                      },
                    ],
                  },
                  arguments: [],
                  memoize: false,
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
                'my-formula2': {
                  name: 'my-formula2',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [],
                  },
                  arguments: [],
                  memoize: false,
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {
                'my-variable': {
                  initialValue: {
                    type: 'apply',
                    name: 'my-formula',
                    arguments: [],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              route: {
                info: {
                  meta: {
                    xyz: {
                      tag: HeadTagTypes.Script,
                      attrs: {},
                      content: {
                        type: 'apply',
                        name: 'my-formula2',
                        arguments: [],
                      },
                    },
                  },
                },
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect component formulas with references through context', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [
                      {
                        name: 'Input',
                        formula: { type: 'value', value: 5 },
                      },
                    ],
                  },
                  arguments: [],
                  memoize: false,
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
            'my-component': {
              name: 'my-component',
              nodes: {},

              apis: {},
              attributes: {},
              variables: {
                'my-variable': {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'page', 'my-formula'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                page: {
                  formulas: ['my-formula'],
                  workflows: [],
                },
              },
            },
          },
        },
        rules: [noReferenceComponentFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should report when subscribed, but no usage', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [
                      {
                        name: 'Input',
                        formula: { type: 'value', value: 5 },
                      },
                    ],
                  },
                  arguments: [],
                  memoize: false,
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
            'my-component': {
              name: 'my-component',
              nodes: {},

              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                page: {
                  formulas: ['my-formula'],
                  workflows: [],
                },
              },
            },
          },
        },
        rules: [noReferenceComponentFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component formula')
    expect(problems[0].details).toEqual({
      contextSubscribers: ['my-component'],
      name: 'my-formula',
    })
  })

  test('should detect formulas that only reference themselves', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            page: {
              name: 'my-page',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  formula: {
                    type: 'function',
                    name: '@toddle/number',
                    arguments: [
                      {
                        name: 'Input',
                        formula: {
                          type: 'apply',
                          name: 'my-formula',
                          arguments: [],
                        },
                      },
                    ],
                  },
                  arguments: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [noReferenceComponentFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component formula')
    expect(problems[0].path).toEqual([
      'components',
      'page',
      'formulas',
      'my-formula',
    ])
  })
})
