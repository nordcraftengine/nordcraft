import { searchProject } from '../../searchProject'
import { createRequiredElementAttributeRule } from './createRequiredElementAttributeRule'

import { describe, expect, test } from 'bun:test'
describe('requiredElementAttributeRule', () => {
  test('should detect missing required element attribute', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'img',
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
        rules: [createRequiredElementAttributeRule('img', 'alt')],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('required element attribute')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
  })
})
