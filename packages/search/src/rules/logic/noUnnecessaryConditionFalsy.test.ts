import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { noUnnecessaryConditionFalsy } from './noUnnecessaryConditionFalsy'

describe('noUnnecessaryConditionFalsy', () => {
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
                      type: 'and',
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
                            value: false,
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
        rules: [noUnnecessaryConditionFalsy],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-unnecessary-condition-falsy')
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
        rules: [noUnnecessaryConditionFalsy],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
