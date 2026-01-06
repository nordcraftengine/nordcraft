import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { invalidComponentStructureRule } from './invalidComponentStructureRule'

describe('detect invalidComponentStructureRule', () => {
  test('should detect invalid components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            invalidComponent: {
              name: 45 as any, // should be string
              nodes: [] as any, // should be object
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [invalidComponentStructureRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('invalid component structure')
    expect(problems[0].path).toEqual(['components', 'invalidComponent', 'name'])
    expect(problems[1].code).toBe('invalid component structure')
    expect(problems[1].path).toEqual([
      'components',
      'invalidComponent',
      'nodes',
    ])
  })
})
