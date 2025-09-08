import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../fixProject'
import { searchProject } from '../searchProject'
import { noReferenceNodeRule } from './noReferenceNodeRule'

describe('find noReferenceNodeRule', () => {
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
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      '1LisbD0eCjsuccoUwajn1',
    ])
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

describe('fix noReferenceNodeRule', () => {
  test('should delete nodes with no references', () => {
    const files: ProjectFiles = {
      formulas: {},
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              id: 'root',
              type: 'element',
              tag: 'div',
              children: ['used'],
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
            used: {
              id: 'used',
              type: 'text',
              value: { type: 'value', value: 'I am used' },
            },
          },
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedFiles = fixProject({
      files,
      rule: noReferenceNodeRule,
      fixType: 'delete-orphan-node',
    })
    expect(Object.keys(fixedFiles.components.test!.nodes)).toEqual([
      'root',
      'used',
    ])
  })
})
