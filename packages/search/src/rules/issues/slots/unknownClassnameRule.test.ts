import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownClassnameRule } from './unknownClassnameRule'

describe('unknownClassname', () => {
  test('should report referencing unknown classnames', () => {
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
                      formula: valueFormula(true),
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                  variants: [
                    {
                      className: 'unknown',
                      breakpoint: 'small',
                      style: {},
                    },
                  ],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownClassnameRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown classname')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not report classnames that exist', () => {
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
                      formula: valueFormula(true),
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                  variants: [
                    {
                      className: 'my-class',
                      breakpoint: 'small',
                      style: {},
                    },
                  ],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownClassnameRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
