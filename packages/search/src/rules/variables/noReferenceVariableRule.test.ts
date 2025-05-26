import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { noReferenceVariableRule } from './noReferenceVariableRule'

describe('noReferenceVariableRule', () => {
  test('should detect variables with no references', () => {
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
              attributes: {},
              variables: {
                'my-variable': {
                  initialValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference variable')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'variables',
      'my-variable',
    ])
  })

  test('should not detect variables with references', () => {
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
                          path: [
                            'Variables',
                            'my-variable',
                            'some-nested-value',
                          ],
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
              attributes: {},
              variables: {
                'my-variable': {
                  initialValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceVariableRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
