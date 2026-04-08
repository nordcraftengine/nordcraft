import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noEmptyUrlParameterNameRule } from './noEmptyUrlParameterNameRule'

describe('noEmptyUrlParameterNameRule', () => {
  test('should report empty path/query parameters', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              route: {
                path: [
                  { name: 'validParam', type: 'static' },
                  { name: '   ', type: 'static' },
                ],
                query: {
                  'valid-query': {
                    name: 'valid-query',
                    testValue: '',
                  },
                  '': {
                    name: '',
                    testValue: '',
                  },
                },
              },
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noEmptyUrlParameterNameRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-empty url parameter name')
    expect(problems[0].details).toEqual({ name: '   ' })
    expect(problems[1].code).toBe('no-empty url parameter name')
    expect(problems[1].details).toEqual({ name: '' })
  })

  test('should not report url parameters that are not empty', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              route: {
                path: [{ name: 'validParam', type: 'static' }],
                query: {
                  'valid-query': {
                    name: 'valid-query',
                    testValue: '',
                  },
                },
              },
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noEmptyUrlParameterNameRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
