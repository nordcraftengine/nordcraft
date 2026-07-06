import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { invalidPathRule } from './invalidPathRule'

describe('invalidPathRule', () => {
  test('should detect path formulas starting with Formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Formulas', 'someFormula'],
                      },
                    },
                  },
                  events: {},
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
        rules: [invalidPathRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid path formula')
    expect(problems[0].info.title).toBe('Invalid path reference')
  })

  test('should detect path formulas starting with Workflows', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Workflows', 'someWorkflow'],
                      },
                    },
                  },
                  events: {},
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
        rules: [invalidPathRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid path formula')
  })

  test('should not detect valid path formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {
                    'my-class': {
                      formula: {
                        type: 'path',
                        path: ['Variables', 'someVar'],
                      },
                    },
                  },
                  events: {},
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
        rules: [invalidPathRule],
      }),
    )

    expect(problems).toEqual([])
  })
})
