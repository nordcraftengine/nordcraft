import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownProjectActionRule } from './unknownProjectActionRule'

describe('unknownProjectActionRule', () => {
  test('should find unknown project actions', () => {
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
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'missing-action',
                  },
                  {
                    name: 'missing-package-action',
                    package: 'my-package',
                  },
                ],
              },
            },
          },
        },
        rules: [unknownProjectActionRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown project action')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '0',
    ])
    expect(problems[1].code).toBe('unknown project action')
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '1',
    ])
  })
  test('should not report known actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'known-action': {
              name: 'known-action',
              handler: '',
              arguments: [],
              variableArguments: false,
            },
          },
          packages: {
            'my-package': {
              components: {},
              actions: {
                'package-action': {
                  name: 'package-action',
                  handler: '',
                  arguments: [],
                  variableArguments: false,
                },
              },
              manifest: {
                name: 'my-package',
                commit: '123',
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'known-action',
                  },
                  {
                    name: 'package-action',
                    package: 'my-package',
                  },
                  {
                    name: '@toddle/clearLocalStorage',
                    arguments: [],
                  },
                ],
              },
            },
          },
        },
        rules: [unknownProjectActionRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
