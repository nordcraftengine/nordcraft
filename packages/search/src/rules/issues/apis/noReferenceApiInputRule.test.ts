import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noReferenceApiInputRule } from './noReferenceApiInputRule'

describe('noReferenceApiInputRule', () => {
  test('should detect API inputs with no references', () => {
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
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {
                    first: { formula: valueFormula('hello') },
                    second: { formula: valueFormula('world') },
                  },
                  body: {
                    type: 'path',
                    path: ['Args', 'first'],
                  },
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
        rules: [noReferenceApiInputRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference api input')
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-api',
      'inputs',
      'second',
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
        rules: [noReferenceApiInputRule],
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
        rules: [noReferenceApiInputRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
