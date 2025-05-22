import { searchProject } from '../../searchProject'
import { createRequiredMetaTagRule } from './createRequiredMetaTagRule'

import { describe, expect, test } from 'bun:test'
describe('createRequiredMetaTagRule', () => {
  test('should detect missing required meta tag', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            'test-page': {
              name: 'test-page',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {
                  title: { formula: { type: 'value', value: null } },
                },
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [
          createRequiredMetaTagRule('title'),
          createRequiredMetaTagRule('description'),
        ],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('required meta tag')
    expect(problems[0].details.tag).toEqual('title')
    expect(problems[1].code).toBe('required meta tag')
    expect(problems[1].details.tag).toEqual('description')
  })
  test('should not detect meta tags with required meta tag', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            'test-page': {
              name: 'test-page',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {
                  title: { formula: { type: 'value', value: 'some value' } },
                  description: {
                    formula: { type: 'and', arguments: [] },
                  },
                },
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [
          createRequiredMetaTagRule('title'),
          createRequiredMetaTagRule('description'),
        ],
      }),
    )

    expect(problems).toEqual([])
  })
})
