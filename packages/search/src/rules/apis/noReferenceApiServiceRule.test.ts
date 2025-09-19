import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { noReferenceApiServiceRule } from './noReferenceApiServiceRule'

describe('find noReferenceApiServiceRule', () => {
  test('should detect API services with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          services: {
            'unused-service': {
              name: 'my-service',
              type: 'supabase',
              meta: {},
            },
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
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiServiceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference api service')
    expect(problems[0].path).toEqual(['services', 'unused-service'])
  })
})

describe('fix noReferenceApiServiceRule', () => {
  test('should remove unused API services', () => {
    const project: ProjectFiles = {
      formulas: {},
      services: {
        'unused-service': {
          name: 'my-service',
          type: 'supabase',
          meta: {},
        },
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
      rule: noReferenceApiServiceRule,
      fixType: 'delete-api-service',
    })
    expect(Object.keys(fixedProject.services!)).toHaveLength(1)
  })
})
