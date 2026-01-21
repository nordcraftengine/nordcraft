import type { ElementNodeModel } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { legacyStyleVariableRule } from './legacyStyleVariableRule'

describe('legacyStyleVariableRule', () => {
  test('should detect legacy style variables', () => {
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
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                  'style-variables': [
                    {
                      category: 'color',
                      name: 'my-legacy-color',
                      formula: {
                        type: 'value',
                        value: '#ff0000',
                      },
                    },
                  ],
                },
              },
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [legacyStyleVariableRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('legacy style variable')
    expect(problems[0].details).toEqual({ name: 'my-legacy-color' })
  })

  test('should fix legacy style variables by replacing them with custom properties', () => {
    const files = fixProject({
      files: {
        components: {
          test: {
            name: 'test',
            nodes: {
              root: {
                type: 'element',
                attrs: {},
                classes: {},
                events: {},
                tag: 'div',
                children: [],
                style: {},
                'style-variables': [
                  {
                    category: 'border-radius',
                    name: 'my-radius',
                    formula: {
                      type: 'value',
                      value: '8',
                    },
                    unit: 'px',
                  },
                ],
              },
            },
            apis: {},
            attributes: {},
            variables: {},
          },
        },
      },
      rule: legacyStyleVariableRule,
      fixType: 'replace-legacy-style-variable',
      state: {},
    })

    const updatedVariable = (
      files.components['test']?.nodes?.root as ElementNodeModel
    )['style-variables']?.find((v) => v.name === 'my-radius')

    expect(updatedVariable).toBeUndefined()

    const customProperty = (
      files.components['test']?.nodes?.root as ElementNodeModel
    ).customProperties?.['--my-radius']

    expect(customProperty).toBeDefined()
    expect(customProperty).toEqual({
      formula: {
        type: 'value',
        value: '8',
      },
      unit: 'px',
      syntax: {
        type: 'primitive',
        name: 'length-percentage',
      },
    })
  })
})
