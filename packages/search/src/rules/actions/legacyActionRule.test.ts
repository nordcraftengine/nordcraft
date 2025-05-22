import { searchProject } from '../../searchProject'
import { legacyActionRule } from './legacyActionRule'

import { describe, expect, test } from 'bun:test'
describe('legacyAction', () => {
  test('should detect legacy actions used in components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    name: 'If',
                    events: {
                      true: {
                        actions: [],
                      },
                      false: {
                        actions: [],
                      },
                    },
                    arguments: [
                      {
                        name: 'Condition',
                        formula: {
                          type: 'value',
                          value: true,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [legacyActionRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'onLoad',
      'actions',
      '0',
    ])
  })
  test('should not detect non-legacy actions used in components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    type: 'Fetch',
                    api: 'my-api',
                    inputs: {},
                    onSuccess: { actions: [] },
                    onError: { actions: [] },
                  },
                ],
              },
            },
          },
        },
        rules: [legacyActionRule],
      }),
    )
    expect(problems).toHaveLength(0)
  })
})
