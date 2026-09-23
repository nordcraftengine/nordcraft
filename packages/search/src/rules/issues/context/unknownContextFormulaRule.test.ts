import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownContextFormulaRule } from './unknownContextFormulaRule'

describe('unknownContextFormulaRule', () => {
  test('should detect context formulas that are not subscribed', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                test: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'unknown', 'test'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
                test2: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'known', 'unknown'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextFormulaRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect((problems[0] as any).code).toBe('unknown context formula')
    expect((problems[1] as any).code).toBe('unknown context formula')
  })

  test('should not detect when context formulas are subscribed', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            consumer: {
              name: 'consumer',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                test: {
                  initialValue: {
                    type: 'path',
                    path: ['Contexts', 'known', 'test'],
                  },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [unknownContextFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should apply add-context-subscription fix', () => {
    const files = {
      components: {
        consumer: {
          name: 'consumer',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {
            test: {
              initialValue: {
                type: 'path',
                path: ['Contexts', 'provider', 'testFormula'],
              },
              '@nordcraft/metadata': {
                comments: null,
              },
            },
          },
          contexts: {},
        },
      },
    } as any

    const results = Array.from(
      searchProject({
        files,
        rules: [unknownContextFormulaRule],
        fixOptions: {
          mode: 'FIX',
          fixType: 'add-context-subscription',
        },
      }),
    )

    expect(results).toHaveLength(1)
    const updatedFiles = results[0] as any
    expect(updatedFiles.components.consumer.contexts.provider).toBeDefined()
    expect(
      updatedFiles.components.consumer.contexts.provider.formulas,
    ).toContain('testFormula')
    expect(
      updatedFiles.components.consumer.contexts.provider.componentName,
    ).toBe('provider')
  })
})
