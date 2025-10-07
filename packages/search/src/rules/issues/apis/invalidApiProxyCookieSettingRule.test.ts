import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { invalidApiProxyCookieSettingRule } from './invalidApiProxyCookieSettingRule'

describe('invalidApiProxyCookieSettingRule', () => {
  test('should report invalid usage of GetHttpOnlyCookie when the API is not proxied', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  headers: {
                    Authorization: {
                      formula: {
                        type: 'function',
                        name: '@toddle/concatenate',
                        arguments: [
                          { formula: { type: 'value', value: 'Bearer ' } },
                          {
                            formula: {
                              type: 'function',
                              name: '@toddle/getHttpOnlyCookie',
                              arguments: [
                                {
                                  formula: {
                                    type: 'value',
                                    value: 'access_token',
                                  },
                                },
                              ],
                              display_name: 'Get Http-Only Cookie',
                            },
                          },
                        ],
                        display_name: 'Concatenate',
                      },
                    },
                  },
                  server: {
                    proxy: {
                      enabled: { formula: valueFormula(true) },
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidApiProxyCookieSettingRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid api proxy cookie setting')
    expect(problems[0].details).toEqual({ api: 'my-api' })
  })

  test('should not report valid usage of GetHttpOnlyCookie when API is proxied', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  headers: {
                    Authorization: {
                      formula: {
                        type: 'function',
                        name: '@toddle/concatenate',
                        arguments: [
                          { formula: { type: 'value', value: 'Bearer ' } },
                          {
                            formula: {
                              type: 'function',
                              name: '@toddle/getHttpOnlyCookie',
                              arguments: [
                                {
                                  formula: {
                                    type: 'value',
                                    value: 'access_token',
                                  },
                                },
                              ],
                              display_name: 'Get Http-Only Cookie',
                            },
                          },
                        ],
                        display_name: 'Concatenate',
                      },
                    },
                  },
                  server: {
                    proxy: {
                      enabled: { formula: valueFormula(false) },
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidApiProxyCookieSettingRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
