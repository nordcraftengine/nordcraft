import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { searchProject } from '../../searchProject'
import { unknownSetUrlParametersRule } from './unknownSetUrlParametersRule'

import { describe, expect, test } from 'bun:test'
describe('unknownSetUrlParametersRule', () => {
  test('should report setting unknown URL parameters', () => {
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
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'SetURLParameters',
                          parameters: { unknown: valueFormula('newValue') },
                        },
                      ],
                    },
                  },
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
        rules: [unknownSetUrlParametersRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown set url parameters')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should report setting static path parameters', () => {
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
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'SetURLParameters',
                          parameters: { knownPath: valueFormula('newValue') },
                        },
                      ],
                    },
                  },
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [
                  {
                    name: 'knownPath',
                    type: 'static',
                  },
                ],
                query: {},
              },
            },
          },
        },
        rules: [unknownSetUrlParametersRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown set url parameters')
    expect(problems[0].details).toEqual({ name: 'knownPath' })
  })

  test('should not report valid url updates', () => {
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
                  classes: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'SetURLParameter',
                          parameter: 'known-query',
                          data: valueFormula('newValue'),
                        },
                        {
                          type: 'SetURLParameter',
                          parameter: 'known-path',
                          data: valueFormula('newValue'),
                        },
                      ],
                    },
                  },
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [{ name: 'known-path', type: 'param', testValue: 'bla' }],
                query: {
                  'known-query': {
                    name: 'known-query',
                    testValue: '',
                  },
                },
              },
            },
          },
        },
        rules: [unknownSetUrlParametersRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
