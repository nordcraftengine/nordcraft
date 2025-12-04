import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceAttributeRule } from './noReferenceAttributeRule'

describe('find noReferenceAttributeRule', () => {
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

  test('should ignore unused attributes when the component has onAttributeChange actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
              onAttributeChange: {
                trigger: 'onAttributeChange',
                actions: [
                  {
                    type: 'Custom',
                    name: 'Log',
                    version: 2,
                  },
                ],
              },
            },
          },
        },
        rules: [noReferenceAttributeRule],
      }),
    )

    expect(problems).toEqual([])
  })
})

describe('fix noReferenceAttributeRule', () => {
  test('should remove attributes with no references', () => {
    const files: ProjectFiles = {
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
    }
    const fixedFiles = fixProject({
      files,
      rule: noReferenceAttributeRule,
      fixType: 'delete-attribute',
    })
    expect(fixedFiles.components['test']?.attributes).toEqual({})
  })
})
