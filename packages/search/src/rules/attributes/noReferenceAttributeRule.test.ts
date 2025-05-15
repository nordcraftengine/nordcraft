import { searchProject } from '../../searchProject'
import { noReferenceAttributeRule } from './noReferenceAttributeRule'

describe('noReferenceAttributeRule', () => {
  test('should detect attributes with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute-name',
                  testValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference attribute')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'attributes',
      'my-attribute',
    ])
  })

  test('should not detect attributes with references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  arguments: [],
                  formula: {
                    type: 'apply',
                    name: 'test',
                    arguments: [
                      {
                        formula: {
                          type: 'path',
                          path: ['Attributes', 'my-attribute'],
                        },
                      },
                    ],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute',
                  testValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should work for legacy attributes without a `name` property', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {
                'my-formula': {
                  name: 'my-formula',
                  arguments: [],
                  formula: {
                    type: 'apply',
                    name: 'test',
                    arguments: [
                      {
                        formula: {
                          type: 'path',
                          path: ['Attributes', 'my-attribute'],
                        },
                      },
                    ],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {
                'my-attribute': {
                  testValue: { type: 'value', value: null },
                } as any,
              },
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
