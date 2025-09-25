import type { ApiRequest } from '@nordcraft/core/dist/api/apiTypes'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { unknownApiServiceRule } from './unknownApiServiceRule'

describe('find unknownApiServiceRule', () => {
  test('should detect references to unknown services', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          services: {
            'used-service': {
              name: 'used-service',
              type: 'supabase',
              meta: {},
            },
          },
          components: {
            apiComponent: {
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
                  service: 'used-service',
                },
                'my-other-api': {
                  name: 'my-other-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  service: 'unknown-service',
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownApiServiceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown api service')
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-other-api',
      'service',
    ])
    expect(problems[0].details).toEqual({
      apiName: 'my-other-api',
      serviceName: 'unknown-service',
    })
  })
})

describe('fix unknownApiServiceRule', () => {
  test('should remove references to unknown services', () => {
    const project: ProjectFiles = {
      formulas: {},
      services: {
        'used-service': {
          name: 'used-service',
          type: 'supabase',
          meta: {},
        },
      },
      components: {
        apiComponent: {
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
              service: 'used-service',
            },
            'my-other-api': {
              name: 'my-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(true),
              inputs: {},
              service: 'unknown-service',
            },
          },
          onLoad: {
            trigger: 'onLoad',
            actions: [],
          },
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: project,
      rule: unknownApiServiceRule,
      fixType: 'delete-api-service-reference',
    })
    expect(
      (
        fixedProject.components['apiComponent']?.apis[
          'my-other-api'
        ] as ApiRequest
      ).service,
    ).toBeUndefined()
    expect(fixedProject.components['apiComponent']?.apis)
      .toMatchInlineSnapshot(`
      {
        "my-api": {
          "autoFetch": {
            "type": "value",
            "value": true,
          },
          "inputs": {},
          "name": "my-api",
          "service": "used-service",
          "type": "http",
          "version": 2,
        },
        "my-other-api": {
          "autoFetch": {
            "type": "value",
            "value": true,
          },
          "inputs": {},
          "name": "my-api",
          "type": "http",
          "version": 2,
        },
      }
    `)
  })
})
