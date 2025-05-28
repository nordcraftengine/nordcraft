import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { unknownContextProviderRule } from './unknownContextProviderRule'

describe('unknownContextProviderRule', () => {
  test('should detect context from component that does not exist', () => {
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
              variables: {},
              contexts: {
                unknown: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'unknown',
                },
              },
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownContextProviderRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown context provider')
  })

  test('should not detect when context exist', () => {
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
              variables: {},
              contexts: {
                provider: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'provider',
                },
              },
            },
            provider: {
              name: 'provider',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownContextProviderRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
