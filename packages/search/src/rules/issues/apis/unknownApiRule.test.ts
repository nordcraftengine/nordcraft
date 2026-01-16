import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownApiRule } from './unknownApiRule'

describe('unknownApi', () => {
  test('should report reading unknown apis from formula', () => {
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
                        path: ['Apis', 'my-api'],
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
        rules: [unknownApiRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown api')
    expect(problems[0].details).toEqual({ name: 'my-api' })
  })

  test('should report reading unknown apis from actions', () => {
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
                          api: 'unknown-api',
                          inputs: {},
                          onSuccess: { actions: [] },
                          onError: { actions: [] },
                        },
                        {
                          type: 'AbortFetch',
                          api: 'unknown-abort-api',
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
        rules: [unknownApiRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown api')
    expect(problems[0].details).toEqual({ name: 'unknown-api' })
    expect(problems[1].code).toBe('unknown api')
    expect(problems[1].details).toEqual({ name: 'unknown-abort-api' })
  })

  test('should not report APIs that exist', () => {
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
                        path: ['Apis', 'my-api', 'data'],
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
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'REST',
                  onCompleted: null,
                  onFailed: null,
                },
              },
              variables: {},
              attributes: {
                known: {
                  name: 'known',
                  testValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownApiRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
