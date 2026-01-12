import { ApiMethod } from '@nordcraft/core/dist/api/apiTypes'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { legacyApiRule } from './legacyApiRule'

describe('legacyApi', () => {
  test('should detect legacy APIs', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              apis: {
                'my-api': {
                  url: valueFormula('https://legacy.com'),
                  method: 'GET',
                  headers: {},
                  path: [],
                  queryParams: {},
                  name: 'my-api',
                  type: 'REST',
                  onCompleted: null,
                  onFailed: null,
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyApiRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('legacy api')
    expect(problems[0].details).toEqual({ name: 'my-api' })
  })

  test('should not detect new APIs', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              apis: {
                'my-api': {
                  url: valueFormula('https://legacy.com'),
                  version: 2,
                  name: 'my-api',
                  type: 'http',
                  inputs: {},
                  method: ApiMethod.GET,
                  headers: {},
                  path: {},
                  queryParams: {},
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyApiRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
