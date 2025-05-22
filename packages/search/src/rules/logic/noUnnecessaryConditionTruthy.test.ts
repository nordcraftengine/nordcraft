import { searchProject } from '../../searchProject'
import { noUnnecessaryConditionTruthy } from './noUnnecessaryConditionTruthy'

import { describe, expect, test } from 'bun:test'
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
                    test2: {
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
                    test3: {
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

    expect(problems).toHaveLength(3)
    expect(problems[0].code).toBe('no-unnecessary-condition-truthy')
    expect(problems[1].code).toBe('no-unnecessary-condition-truthy')
    expect(problems[2].code).toBe('no-unnecessary-condition-truthy')
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
