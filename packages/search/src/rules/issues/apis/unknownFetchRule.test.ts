import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownFetchInputRule } from './unknownFetchInputRule'

describe.only('unknownFetchInput', () => {
  test('should report unknown api input overrides', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'Fetch',
                    api: 'my-api',
                    inputs: {
                      invalidInput: { formula: valueFormula('test') },
                    },
                    onSuccess: { actions: [] },
                    onError: { actions: [] },
                  },
                ],
              },
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
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {
                    validInput: {
                      formula: valueFormula(null),
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownFetchInputRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown fetch input')
    expect(problems[0].details).toEqual({ name: 'invalidInput' })
  })
})
