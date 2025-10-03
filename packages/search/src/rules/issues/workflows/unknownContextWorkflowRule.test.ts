import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownContextWorkflowRule } from './unknownContextWorkflowRule'

describe('unknownContextWorkflowRule', () => {
  test('should detect context workflows that are not subscribed', () => {
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
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'test',
                    contextProvider: 'unknown',
                    parameters: {},
                  },
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'unknown',
                    contextProvider: 'known',
                    parameters: {},
                  },
                ],
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
        rules: [unknownContextWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown context workflow')
    expect(problems[1].code).toBe('unknown context workflow')
  })

  test('should not detect when context workflows are subscribed', () => {
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
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'test',
                    contextProvider: 'known',
                    parameters: {},
                  },
                ],
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
        rules: [unknownContextWorkflowRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
