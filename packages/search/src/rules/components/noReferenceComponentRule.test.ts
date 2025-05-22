import { searchProject } from '../../searchProject'
import { noReferenceComponentRule } from './noReferenceComponentRule'

import { describe, expect, test } from 'bun:test'
describe('noReferenceComponentRule', () => {
  test('should detect components with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            orphan: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            exportedOrphan: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              exported: true,
            },
            page: {
              name: 'my-page',
              nodes: {},
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
        rules: [noReferenceComponentRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component')
    expect(problems[0].path).toEqual(['components', 'orphan'])
  })
  test('should detect components that are only referenced by themselves', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            orphan: {
              name: 'test',
              nodes: {
                abc: {
                  type: 'component',
                  attrs: {},
                  children: [],
                  name: 'test',
                  events: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            page: {
              name: 'my-page',
              nodes: {},
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
        rules: [noReferenceComponentRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference component')
    expect(problems[0].path).toEqual(['components', 'orphan'])
  })

  test('should not detect components with references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            abcd: {
              name: 'my-component',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            page: {
              name: 'my-page',
              nodes: {
                root: {
                  type: 'component',
                  name: 'my-component',
                  attrs: {},
                  children: [],
                  events: {},
                },
              },
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
        rules: [noReferenceComponentRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
