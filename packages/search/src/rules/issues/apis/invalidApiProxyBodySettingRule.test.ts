import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { invalidApiProxyBodySettingRule } from './invalidApiProxyBodySettingRule'

describe('invalidApiProxyBodySetting', () => {
  test('should report invalid proxy body settings for an API with proxying disabled', () => {
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
                  server: {
                    proxy: {
                      enabled: { formula: valueFormula(false) },
                      useTemplatesInBody: { formula: valueFormula(true) },
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidApiProxyBodySettingRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid api proxy body setting')
    expect(problems[0].details).toEqual({ api: 'my-api' })
  })

  test('should not report valid body proxy settings', () => {
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
                  server: {
                    proxy: {
                      enabled: { formula: valueFormula(true) },
                      useTemplatesInBody: { formula: valueFormula(true) },
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidApiProxyBodySettingRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
