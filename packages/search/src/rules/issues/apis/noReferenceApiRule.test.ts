import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceApiRule } from './noReferenceApiRule'

describe('find noReferenceApiRule', () => {
  test('should detect APIs with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {
                'my-legacy-api': {
                  name: 'my-legacy-api',
                  type: 'REST',
                  autoFetch: valueFormula(true),
                  onCompleted: null,
                  onFailed: null,
                },
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-reference api')
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-legacy-api',
    ])
    expect(problems[1].code).toBe('no-reference api')
    expect(problems[1].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-api',
    ])
  })

  test('should not detect APIs with references from formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'p',
                  attrs: {},
                  condition: pathFormula(['Apis', 'my-api', 'data', 'success']),
                  style: {},
                  children: [],
                  classes: {},
                  events: {},
                },
              },
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toEqual([])
  })
  test('should not detect APIs with references from actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'button',
                  attrs: {},
                  style: {},
                  children: [],
                  classes: {},
                  events: {
                    onClick: {
                      trigger: 'onClick',
                      actions: [
                        {
                          type: 'Fetch',
                          api: 'my-api',
                          inputs: {},
                          onSuccess: { actions: [] },
                          onError: { actions: [] },
                        },
                      ],
                    },
                  },
                },
              },
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toEqual([])
  })
})

describe('fix noReferenceApiRule', () => {
  test('should remove unused APIs', () => {
    const project: ProjectFiles = {
      formulas: {},
      components: {
        apiComponent: {
          name: 'test',
          nodes: {},
          formulas: {},
          apis: {
            'my-legacy-api': {
              name: 'my-legacy-api',
              type: 'REST',
              autoFetch: valueFormula(true),
              onCompleted: null,
              onFailed: null,
            },
            'my-api': {
              name: 'my-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(true),
              inputs: {},
              '@nordcraft/metadata': {
                comments: null,
              },
            },
            'used-api': {
              name: 'used-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(true),
              inputs: {},
            },
          },
          onLoad: {
            trigger: 'onLoad',
            actions: [
              {
                type: 'Fetch',
                api: 'used-api',
                inputs: {},
                onSuccess: { actions: [] },
                onError: { actions: [] },
              },
            ],
          },
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: project,
      rule: noReferenceApiRule,
      fixType: 'delete-api',
    })
    // 2/3 APIs should be removed
    expect(Object.keys(fixedProject.components['apiComponent']!.apis)).toEqual([
      'used-api',
    ])
  })
})
