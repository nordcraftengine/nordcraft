import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceProjectActionRule } from './noReferenceProjectActionRule'

describe('find noReferenceProjectAction', () => {
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
                version: 2,
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

describe('fix noReferenceProjectAction', () => {
  test('should remove unused global actions', () => {
    const files: ProjectFiles = {
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
    }
    const fixedProject = fixProject({
      files,
      rule: noReferenceProjectActionRule,
      fixType: 'delete-project-action',
    })
    expect(fixedProject.actions).toEqual({})
  })
})
