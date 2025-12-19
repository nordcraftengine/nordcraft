import type { ComponentNodeModel } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { unknownComponentAttributeRule } from './unknownComponentAttributeRule'

describe('find unknownComponentAttribute', () => {
  test('should report unknown component attributes', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            referenced: {
              name: 'referenced',
              nodes: {},
              attributes: {
                first: {
                  name: 'first',
                  testValue: valueFormula(null),
                },
                second: {
                  name: 'second',
                  testValue: valueFormula(null),
                },
              },
              apis: {},
              formulas: {},
              variables: {},
            },
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'component',
                  name: 'referenced',
                  events: {},
                  children: [],
                  style: {},
                  attrs: {
                    first: valueFormula('exists'),
                    third: valueFormula('does not exist'),
                  },
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownComponentAttributeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown component attribute')
    expect(problems[0].details).toEqual({
      name: 'third',
      componentName: 'referenced',
    })
  })

  test('should not report component attributes that exist', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    known: valueFormula('exists'),
                  },
                  classes: {},
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
                },
              },
            },
          },
        },
        rules: [unknownComponentAttributeRule],
      }),
    )
    expect(problems).toEqual([])
  })
})

describe('fix unknownComponentAttribute', () => {
  test('should remove unknown component attributes', () => {
    const files: ProjectFiles = {
      components: {
        referenced: {
          name: 'referenced',
          nodes: {},
          attributes: {
            first: {
              name: 'first',
              testValue: valueFormula(null),
            },
            second: {
              name: 'second',
              testValue: valueFormula(null),
            },
          },
          apis: {},
          formulas: {},
          variables: {},
        },
        test: {
          name: 'test',
          nodes: {
            root: {
              type: 'component',
              name: 'referenced',
              events: {},
              children: [],
              style: {},
              attrs: {
                first: valueFormula('exists'),
                third: valueFormula('does not exist'),
              },
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
      rule: unknownComponentAttributeRule,
      fixType: 'delete-component-attribute',
    })
    expect(
      (fixedProject.components.test!.nodes?.root as ComponentNodeModel).attrs,
    ).toEqual({
      first: valueFormula('exists'),
    })
  })
})
