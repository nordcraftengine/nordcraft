import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { IssueResult } from '../../../types'
import { noStaticSwitchCondition } from './noStaticSwitchCondition'

describe('noStaticSwitchCondition', () => {
  test.only('should report static condition using encodeJSON with static arguments', () => {
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
                      type: 'switch',
                      cases: [
                        {
                          condition: {
                            type: 'function',
                            name: '@toddle/encodeJSON',
                            arguments: [
                              {
                                name: 'Data',
                                formula: {
                                  type: 'object',
                                  arguments: [
                                    {
                                      Name: 0,
                                      formula: { type: 'value', value: true },
                                      name: 'key',
                                    },
                                  ],
                                },
                                type: { type: 'Any' },
                              },
                              {
                                name: 'Indent',
                                formula: { type: 'value', value: 2 },
                                type: { type: 'Number' },
                              },
                            ],
                            display_name: 'Encode JSON',
                          },
                          formula: { type: 'value', value: true },
                        },
                      ],
                      default: { type: 'value', value: false },
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
        rules: [noStaticSwitchCondition],
      }),
    )

    expect(problems).toHaveLength(1)
    const firstProblem = problems[0] as any as IssueResult
    expect(firstProblem.code).toBe('no-static-switch-condition')
    expect(firstProblem.level).toBe('info')
    expect(firstProblem.path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'test',
      'cases',
      0,
      'condition',
    ])
    expect(firstProblem.info.description).toInclude(
      'Switch condition is static',
    )
  })

  test('should report static boolean value conditions', () => {
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
                      type: 'switch',
                      cases: [
                        {
                          condition: {
                            type: 'value',
                            value: true,
                          },
                          formula: { type: 'value', value: 'yes' },
                        },
                        {
                          condition: {
                            type: 'value',
                            value: false,
                          },
                          formula: { type: 'value', value: 'no' },
                        },
                      ],
                      default: { type: 'value', value: 'default' },
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
        rules: [noStaticSwitchCondition],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-static-switch-condition')
    expect(problems[0].level).toBe('info')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'test',
      'cases',
      0,
      'condition',
    ])
    expect(problems[1].code).toBe('no-static-switch-condition')
    expect(problems[1].level).toBe('info')
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'test',
      'cases',
      1,
      'condition',
    ])
  })

  test('should report object and array conditions as always truthy', () => {
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
                      type: 'switch',
                      cases: [
                        {
                          condition: {
                            type: 'object',
                            arguments: [],
                          },
                          formula: { type: 'value', value: 1 },
                        },
                        {
                          condition: {
                            type: 'array',
                            arguments: [],
                          },
                          formula: { type: 'value', value: 2 },
                        },
                      ],
                      default: { type: 'value', value: 3 },
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
        rules: [noStaticSwitchCondition],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].info.description).toContain('always truthy')
    expect(problems[1].info.description).toContain('always truthy')
  })

  test('should not report dynamic conditions', () => {
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
                      type: 'switch',
                      cases: [
                        {
                          condition: {
                            type: 'path',
                            path: ['Variables', 'myVar'],
                          },
                          formula: { type: 'value', value: 'dynamic' },
                        },
                        {
                          condition: {
                            type: 'function',
                            name: '@toddle/greaterThan',
                            arguments: [
                              {
                                name: '0',
                                formula: {
                                  type: 'path',
                                  path: ['Variables', 'count'],
                                },
                              },
                              {
                                name: '1',
                                formula: { type: 'value', value: 5 },
                              },
                            ],
                          },
                          formula: { type: 'value', value: 'high' },
                        },
                      ],
                      default: { type: 'value', value: 'none' },
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
        rules: [noStaticSwitchCondition],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
