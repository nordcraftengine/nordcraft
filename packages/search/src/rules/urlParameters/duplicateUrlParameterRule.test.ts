import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { duplicateUrlParameterRule } from './duplicateUrlParameterRule'

describe('duplicateUrlParameterRule', () => {
  test('should detect duplicate URL parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [
                  {
                    type: 'param',
                    name: 'id',
                    testValue: '1',
                  },
                  {
                    type: 'static',
                    name: 'name',
                  },
                ],
                query: {
                  id: {
                    name: 'id',
                    testValue: '1',
                  },
                },
              },
            },
          },
        },
        rules: [duplicateUrlParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate url parameter')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'route',
      'query',
      'id',
    ])
    expect(problems[0].details).toEqual({ name: 'id' })
  })
  test('should detect duplicate path parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [
                  {
                    type: 'param',
                    name: 'company',
                    testValue: '1',
                  },
                  {
                    type: 'static',
                    name: 'company',
                  },
                ],
                query: {},
              },
            },
          },
        },
        rules: [duplicateUrlParameterRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate url parameter')
    expect(problems[0].path).toEqual(['components', 'test', 'route', 'path', 1])
    expect(problems[0].details).toEqual({ name: 'company' })
  })
  test('should not detect non-duplicate URL parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [
                  {
                    type: 'param',
                    name: 'id',
                    testValue: '1',
                  },
                  {
                    type: 'static',
                    name: 'name',
                  },
                ],
                query: {
                  other: {
                    name: 'other',
                    testValue: '1',
                  },
                },
              },
            },
          },
        },
        rules: [duplicateUrlParameterRule],
      }),
    )
    expect(problems).toHaveLength(0)
  })
})
