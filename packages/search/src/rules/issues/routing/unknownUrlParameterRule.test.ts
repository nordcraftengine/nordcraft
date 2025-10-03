import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownUrlParameterRule } from './unknownUrlParameterRule'

describe('unknownUrlParameterRule', () => {
  test('should report reading unknown URL parameters', () => {
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
                        type: 'path',
                        path: ['URL parameters', 'unknown'],
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
        },
        rules: [unknownUrlParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown url parameter')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not report url parameters that exist', () => {
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
                        type: 'path',
                        path: ['URL parameters', 'known-path'],
                      },
                    },
                    'my-other-class': {
                      formula: {
                        type: 'path',
                        path: ['URL parameters', 'known-query'],
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
              route: {
                path: [{ name: 'known-path', type: 'static' }],
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
        rules: [unknownUrlParameterRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
