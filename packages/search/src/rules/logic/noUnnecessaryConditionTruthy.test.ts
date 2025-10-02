import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { noUnnecessaryConditionTruthy } from './noUnnecessaryConditionTruthy'

describe('noUnnecessaryConditionTruthy', () => {
  test('should report unnecessary truthy conditions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test: {
                      type: 'or',
                      arguments: [
                        {
                          formula: {
                            type: 'apply',
                            name: 'other',
                            arguments: [],
                          },
                        },
                        {
                          formula: {
                            type: 'value',
                            value: true,
                          },
                        },
                      ],
                    },
                  },
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
        rules: [noUnnecessaryConditionTruthy],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-unnecessary-condition-truthy')
  })

  test('should report unnecessary truthy conditions when a value is of type object or array as they are always consider truthy', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test1: {
                      type: 'or',
                      arguments: [
                        {
                          formula: {
                            type: 'object',
                            arguments: [],
                          },
                        },
                      ],
                    },
                    test2: {
                      type: 'or',
                      arguments: [
                        {
                          formula: {
                            type: 'array',
                            arguments: [],
                          },
                        },
                      ],
                    },
                  },
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
        rules: [noUnnecessaryConditionTruthy],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-unnecessary-condition-truthy')
    expect(problems[1].code).toBe('no-unnecessary-condition-truthy')
  })

  test('should not report necessary truthy conditions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test: {
                      type: 'or',
                      arguments: [
                        {
                          formula: {
                            type: 'apply',
                            name: 'other',
                            arguments: [],
                          },
                        },
                      ],
                    },
                  },
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
        rules: [noUnnecessaryConditionTruthy],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
