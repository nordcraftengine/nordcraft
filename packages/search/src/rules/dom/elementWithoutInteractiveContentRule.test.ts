import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { elementWithoutInteractiveContentRule } from './elementWithoutInteractiveContentRule'

describe('elementWithoutInteractiveContentRule', () => {
  test('should detect invalid button in button element', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'button',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid element child')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
    expect(problems[0].details).toEqual({
      parentTag: 'button',
      invalidChild: { tag: 'button' },
    })
  })
  test('should detect invalid label in button element', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'label',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid element child')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
    expect(problems[0].details).toEqual({
      parentTag: 'button',
      invalidChild: { tag: 'label' },
    })
  })
  test('should detect invalid element with attribute requirement', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: { href: valueFormula('https://example.com') },
                  classes: {},
                  events: {},
                  tag: 'a',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid element child')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
    expect(problems[0].details).toEqual({
      parentTag: 'button',
      invalidChild: { tag: 'a', whenAttributeIsPresent: 'href' },
    })
  })
  test('should allow element children when attribute requirement is not met', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'a',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(0)
  })
  test('should detect invalid children when negative attribute requirement is met', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: { type: valueFormula('text') },
                  classes: {},
                  events: {},
                  tag: 'input',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(0)
  })
  test('should detect invalid label in button element in nested component', () => {
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
                  tag: 'button',
                  children: ['child1'],
                  style: {},
                },
                child1: {
                  type: 'component',
                  attrs: {},
                  name: 'buttonComponent',
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
            buttonComponent: {
              name: 'buttonComponent',
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
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: ['child2'],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'label',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('invalid element child')
    expect(problems[0].path).toEqual(['components', 'test', 'nodes', 'root'])
    expect(problems[0].details).toEqual({
      parentTag: 'button',
      invalidChild: { tag: 'label' },
    })
  })
  test('should not detect valid element children', () => {
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
                  tag: 'button',
                  children: ['child1', 'child2'],
                  style: {},
                },
                child1: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'p',
                  children: [],
                  style: {},
                },
                child2: {
                  type: 'element',
                  attrs: {},
                  classes: {},
                  events: {},
                  tag: 'p',
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
        rules: [elementWithoutInteractiveContentRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
