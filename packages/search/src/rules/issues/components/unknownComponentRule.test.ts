import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownComponentRule } from './unknownComponentRule'

describe('unknownComponent', () => {
  test('should report unknown component node references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  name: 'unknown',
                  type: 'component',
                  attrs: {},
                  events: {},
                  children: ['test'],
                  style: {},
                },
                test: {
                  name: 'unknown-package',
                  package: 'unknown',
                  type: 'component',
                  attrs: {},
                  events: {},
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
        rules: [unknownComponentRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown component')
    expect(problems[0].details).toEqual({ name: 'unknown' })
    expect(problems[1].code).toBe('unknown component')
    expect(problems[1].details).toEqual({ name: 'unknown-package' })
  })

  test('should not report known component node references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          packages: {
            known_package: {
              manifest: {
                commit: '123',
                name: 'known_package',
              },
              components: {
                known_package_component: {
                  name: 'known_package_component',
                  nodes: {},
                  formulas: {},
                  apis: {},
                  attributes: {},
                  variables: {},
                },
              },
            },
          },
          components: {
            known: {
              name: 'known',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            test: {
              name: 'test',
              nodes: {
                root: {
                  name: 'known',
                  type: 'component',
                  attrs: {},
                  events: {},
                  children: ['test'],
                  style: {},
                },
                test: {
                  name: 'known_package_component',
                  package: 'known_package',
                  type: 'component',
                  attrs: {},
                  events: {},
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
        rules: [unknownComponentRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
