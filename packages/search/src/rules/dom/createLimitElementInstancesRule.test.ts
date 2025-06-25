import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { createLimitElementInstancesRule } from './createLimitElementInstancesRule'

describe('createLimitElementInstancesRule', () => {
  test('should detect too many h1 elements', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              route: {
                path: [],
                query: {},
              },
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child1', 'child2'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'h1',
                  children: [],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'h1',
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
        rules: [createLimitElementInstancesRule('h1', 1)],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('limit element instances')
    expect(problems[0].path).toEqual(['components', 'test'])
    expect(problems[0].details).toEqual({
      tag: 'h1',
      limit: 1,
      instances: 2,
    })
  })
  test('should detect too many main elements in nested components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            myMain: {
              name: 'myMain',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'main',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
            test: {
              route: {
                path: [],
                query: {},
              },
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child1', 'child2'],
                  style: {},
                },
                child1: {
                  type: 'component',
                  attrs: {},
                  events: {},
                  children: [],
                  style: {},
                  name: 'myMain',
                },
                child2: {
                  type: 'component',
                  attrs: {},
                  events: {},
                  children: [],
                  style: {},
                  name: 'myMain',
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [createLimitElementInstancesRule('main', 1)],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('limit element instances')
    expect(problems[0].path).toEqual(['components', 'test'])
    expect(problems[0].details).toEqual({
      tag: 'main',
      limit: 1,
      instances: 2,
    })
  })
  test('should detect too many h1 elements in repeated elements', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              route: {
                path: [],
                query: {},
              },
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  tag: 'h1',
                  attrs: {},
                  events: {},
                  classes: {},
                  children: [],
                  style: {},
                  repeat: {
                    type: 'array',
                    arguments: [
                      { formula: valueFormula('first') },
                      { formula: valueFormula('second') },
                    ],
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
        rules: [createLimitElementInstancesRule('h1', 1)],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('limit element instances')
    expect(problems[0].path).toEqual(['components', 'test'])
    expect(problems[0].details).toEqual({
      tag: 'h1',
      limit: 1,
      instances: 10,
    })
  })
})
