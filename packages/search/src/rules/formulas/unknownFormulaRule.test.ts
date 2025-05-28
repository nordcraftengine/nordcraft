import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { unknownFormulaRule } from './unknownFormulaRule'

describe('unknownFormula', () => {
  test('should detect apply formulas with unknown function', () => {
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
                        type: 'apply',
                        name: 'unknown',
                        arguments: [],
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
        rules: [unknownFormulaRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown formula')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not detect apply formulas with known function', () => {
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
                        type: 'apply',
                        name: 'known',
                        arguments: [],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {
                known: {
                  name: 'known',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: null,
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownFormulaRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
