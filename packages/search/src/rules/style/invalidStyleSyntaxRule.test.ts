import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'

describe('find invalidStyleSyntaxRule', () => {
  test('should find invalid style syntax', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  tag: 'ul',
                  type: 'element',
                  attrs: {},
                  style: {
                    gap: '8px',
                    width: '100%',
                    'max-width': 'calc(NOT VALID',
                    height: '/* 100px */ 22px',
                    '{': '100px',
                  },
                  events: {},
                  classes: {},
                  children: [],
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [invalidStyleSyntaxRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('invalid style syntax')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'style',
      'max-width',
    ])
    expect(problems[0].details.property).toBe('max-width')
    expect(problems[1].details.property).toBe('{')
  })
})

describe('fix invalidStyleSyntaxRule', () => {
  test('should remove an invalid style property', () => {
    const files: ProjectFiles = {
      formulas: {},
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              tag: 'ul',
              type: 'element',
              attrs: {},
              style: {
                gap: '8px',
                width: '100%',
                'max-width': 'calc(NOT VALID',
                height: '/* 100px */ 22px',
                '{': '100px',
              },
              events: {},
              classes: {},
              children: [],
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
      rule: invalidStyleSyntaxRule,
      fixType: 'delete style property',
    })
    expect((fixedFiles.components.test!.nodes.root as ElementNodeModel).style)
      .toMatchInlineSnapshot(`
      {
        "gap": "8px",
        "height": "/* 100px */ 22px",
        "width": "100%",
      }
    `)
  })
})
