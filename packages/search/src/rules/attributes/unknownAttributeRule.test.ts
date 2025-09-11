import type {
  ComponentNodeModel,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { unknownAttributeRule } from './unknownAttributeRule'

describe('find unknownAttribute', () => {
  test('should report reading unknown attributes', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Attributes', 'unknown'],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
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
        rules: [unknownAttributeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown attribute')
    expect(problems[0].details).toEqual({ name: 'unknown' })
  })

  test('should not report attributes that exist', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Attributes', 'known'],
                      },
                    },
                  },
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              variables: {},
              attributes: {
                known: {
                  name: 'known',
                  testValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
            },
          },
        },
        rules: [unknownAttributeRule],
      }),
    )

    expect(problems).toEqual([])
  })
})

describe('fix unknownAttribute', () => {
  test('should remove unknown attributes', () => {
    const files: ProjectFiles = {
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              type: 'element',
              attrs: {},
              classes: {
                'my-class': {
                  formula: {
                    type: 'path',
                    path: ['Attributes', 'unknown'],
                  },
                },
              },
              events: {},
              tag: 'div',
              children: ['comp'],
              style: {},
            },
            comp: {
              type: 'component',
              attrs: {
                unknown: {
                  type: 'path',
                  path: ['Attributes', 'unknown'],
                },
              },
              children: [],
              events: {},
              style: {},
              name: 'unknown-component',
            },
          },
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files,
      rule: unknownAttributeRule,
      fixType: 'delete-attribute',
    })
    expect(
      (fixedProject.components.test!.nodes.root as ElementNodeModel).classes,
    ).toEqual({ 'my-class': {} })
    expect(
      (fixedProject.components.test!.nodes.comp as ComponentNodeModel).attrs,
    ).toEqual({})
  })
})
