import { describe, expect, test } from 'bun:test'
import { searchProject } from '../searchProject'
import { noReferenceNodeRule } from './noReferenceNodeRule'

describe('noReferenceNodeRule', () => {
  test('should detect nodes with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  id: 'root',
                  type: 'element',
                  tag: 'div',
                  children: [],
                  attrs: {},
                  style: {},
                  events: {},
                  classes: {},
                },
                '1LisbD0eCjsuccoUwajn1': {
                  id: 'XdhwPGsdFNI4s8A0oMwre',
                  type: 'text',
                  value: { type: 'value', value: 'Clone the project' },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceNodeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].details).toEqual({ node: '1LisbD0eCjsuccoUwajn1' })
    expect(problems[0].path).toEqual(['components', 'test'])
  })

  test('should not detect nodes with references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  id: 'root',
                  type: 'element',
                  tag: 'div',
                  children: ['1LisbD0eCjsuccoUwajn1'],
                  attrs: {},
                  style: {},
                  events: {},
                  classes: {},
                },
                '1LisbD0eCjsuccoUwajn1': {
                  id: 'XdhwPGsdFNI4s8A0oMwre',
                  type: 'text',
                  value: { type: 'value', value: 'Clone the project' },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceNodeRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
