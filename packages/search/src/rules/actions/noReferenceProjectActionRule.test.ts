import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'

describe('noReferenceProjectAction', () => {
  test('should detect unused global actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'my-action': {
              name: 'my-action',
              arguments: [],
              handler: '() => console.log("test")',
              variableArguments: false,
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
            },
          },
        },
        rules: [noReferenceProjectActionRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference project action')
    expect(problems[0].path).toEqual(['actions', 'my-action'])
  })

  test('should not detect used global actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'my-action': {
              name: 'my-action',
              arguments: [],
              handler: '() => console.log("test")',
              variableArguments: false,
            },
            'my-action2': {
              name: 'my-action2',
              arguments: [],
              handler: '() => console.log("test")',
              variableArguments: false,
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
              workflows: {
                test: {
                  name: 'test',
                  parameters: [],
                  actions: [
                    {
                      name: 'my-action2',
                      arguments: [],
                    },
                  ],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'Custom',
                    name: 'my-action',
                    arguments: [],
                  },
                ],
              },
            },
          },
        },
        rules: [noReferenceProjectActionRule],
      }),
    )

    expect(problems).toEqual([])
  })

  describe('noReferenceProjectAction', () => {
    test('should not detect exported unused global actions', () => {
      const problems = Array.from(
        searchProject({
          files: {
            actions: {
              'my-action': {
                name: 'my-action',
                arguments: [],
                handler: '() => console.log("test")',
                variableArguments: false,
                exported: true,
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
              },
            },
          },
          rules: [noReferenceProjectActionRule],
        }),
      )

      expect(problems).toHaveLength(0)
    })
  })
})
