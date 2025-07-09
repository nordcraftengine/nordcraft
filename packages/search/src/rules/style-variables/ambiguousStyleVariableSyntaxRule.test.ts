import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { ambiguousStyleVariableSyntaxRule } from './ambiguousStyleVariableSyntaxRule'

describe('ambiguousStyleVariableSyntaxRule', () => {
  test('should report when there are style variables with the same name but different syntax', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            component1: {
              name: 'component1',
              nodes: {
                node1: {
                  type: 'element',
                  customProperties: {
                    '--my-variable': {
                      syntax: { type: 'primitive', name: 'length' },
                      formula: { type: 'value', value: '10px' },
                    },
                  },
                  attrs: {},
                  style: {},
                  children: [],
                  events: {},
                  classes: {},
                  tag: 'div',
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              formulas: {},
            },
            component2: {
              name: 'component2',
              nodes: {
                node2: {
                  type: 'element',
                  customProperties: {
                    '--my-variable': {
                      syntax: { type: 'primitive', name: 'color' },
                      formula: { type: 'value', value: '#ff0000' },
                    },
                  },
                  attrs: {},
                  style: {},
                  children: [],
                  events: {},
                  classes: {},
                  tag: 'div',
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              formulas: {},
            },
          },
        },
        rules: [ambiguousStyleVariableSyntaxRule],
      }),
    )
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('ambiguous style variable syntax')
    expect(problems[1].code).toBe('ambiguous style variable syntax')
    expect(problems[0].details.name).toBe('--my-variable')
    expect(problems[1].details.name).toBe('--my-variable')
    expect(problems[0].details.duplicates).toEqual([
      {
        path: [
          'components',
          'component2',
          'nodes',
          'node2',
          'customProperties',
          '--my-variable',
        ],
        syntax: { type: 'primitive', name: 'color' },
      },
    ])
    expect(problems[1].details.duplicates).toEqual([
      {
        path: [
          'components',
          'component1',
          'nodes',
          'node1',
          'customProperties',
          '--my-variable',
        ],
        syntax: { type: 'primitive', name: 'length' },
      },
    ])
  })
})
