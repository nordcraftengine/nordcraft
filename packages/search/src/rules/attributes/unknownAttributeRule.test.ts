import { searchProject } from '../../searchProject'
import { unknownAttributeRule } from './unknownAttributeRule'

describe('unknownAttribute', () => {
  test('should report reading unknown attributes', () => {
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
                        path: ['Attributes', 'unknown'],
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
        rules: [unknownAttributeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown attribute')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not report attributes that exist', () => {
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
                        path: ['Attributes', 'known'],
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
        rules: [unknownAttributeRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
