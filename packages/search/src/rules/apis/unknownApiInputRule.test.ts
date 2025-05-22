import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { searchProject } from '../../searchProject'
import { unknownApiInputRule } from './unknownApiInputRule'

import { describe, expect, test } from 'bun:test'
describe('unknownApiInput', () => {
  test('should report reading unknown api inputs from a formula', () => {
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
                  body: {
                    type: 'path',
                    path: ['ApiInputs', 'unknown-input'],
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
        rules: [unknownApiInputRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown api input')
    expect(problems[0].details).toEqual({ name: 'unknown-input' })
  })

  test('should not report API inputs that exist', () => {
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
                  inputs: {
                    'known-input': {
                      formula: valueFormula('hello'),
                    },
                  },
                  body: {
                    type: 'path',
                    path: ['ApiInputs', 'known-input'],
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
        rules: [unknownApiInputRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
