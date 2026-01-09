import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noStaticNodeCondition } from './noStaticNodeCondition'

describe('noStaticNodeCondition', () => {
  test('should report node condition that is always truthy', () => {
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
                  condition: {
                    type: 'value',
                    value: true,
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
        rules: [noStaticNodeCondition],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-static-node-condition')
    expect(problems[0].details).toEqual({
      result: true,
    })
    expect(problems[0].fixes).toEqual(['remove-condition'])
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'condition',
    ])
  })

  test('should report node condition that is always falsy', () => {
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
                  condition: {
                    type: 'value',
                    value: false,
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
        rules: [noStaticNodeCondition],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-static-node-condition')
    expect(problems[0].details).toEqual({
      result: false,
    })
  })

  test('should not report node condition that is dynamic', () => {
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
                  condition: {
                    type: 'apply',
                    name: 'randomNumber',
                    arguments: [],
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
        rules: [noStaticNodeCondition],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should fix static truthy condition by removing the condition', () => {
    const files: ProjectFiles = {
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
              condition: {
                type: 'value',
                value: true,
              },
            },
          },
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }
    const filesClone = structuredClone(files)
    const fixedFiles = fixProject({
      files,
      rule: noStaticNodeCondition,
      fixType: 'remove-condition',
      pathsToVisit: [['components', 'test', 'nodes', 'root', 'condition']],
    })
    expect(fixedFiles).toEqual({
      components: {
        test: {
          apis: {},
          attributes: {},
          formulas: {},
          name: 'test',
          nodes: {
            root: {
              attrs: {},
              children: [],
              classes: {},
              events: {},
              style: {},
              tag: 'div',
              type: 'element',
            },
          },
          variables: {},
        },
      },
    })

    // Also ensure that the original files are not mutated
    expect(files).toEqual(filesClone)
  })

  test('should fix static falsy condition by removing the node and any references to it', () => {
    const files: ProjectFiles = {
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
              children: ['alwaysHiddenElement', 'sometimesVisibleElement'],
              style: {},
            },
            alwaysHiddenElement: {
              type: 'element',
              attrs: {},
              classes: {},
              events: {},
              tag: 'div',
              children: ['child'],
              style: {},
              condition: {
                type: 'value',
                value: false,
              },
            },
            sometimesVisibleElement: {
              type: 'element',
              attrs: {},
              classes: {},
              events: {},
              tag: 'div',
              children: [],
              style: {},
              condition: {
                type: 'path',
                path: ['Variables', 'maybe'],
              },
            },
            child: {
              type: 'element',
              attrs: {},
              classes: {},
              events: {},
              tag: 'div',
              children: ['childsChild'],
              style: {},
            },
            childsChild: {
              type: 'element',
              attrs: {},
              classes: {},
              events: {},
              tag: 'div',
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
    }
    const filesClone = structuredClone(files)
    const fixedFiles = fixProject({
      files,
      rule: noStaticNodeCondition,
      fixType: 'remove-node',
      pathsToVisit: [
        ['components', 'test', 'nodes', 'alwaysHiddenElement', 'condition'],
      ],
    })

    expect(fixedFiles).toEqual({
      components: {
        test: {
          apis: {},
          attributes: {},
          formulas: {},
          name: 'test',
          nodes: {
            root: {
              attrs: {},
              children: ['sometimesVisibleElement'],
              classes: {},
              events: {},
              style: {},
              tag: 'div',
              type: 'element',
            },
            sometimesVisibleElement: {
              attrs: {},
              children: [],
              classes: {},
              condition: {
                path: ['Variables', 'maybe'],
                type: 'path',
              },
              events: {},
              style: {},
              tag: 'div',
              type: 'element',
            },
          },
          variables: {},
        },
      },
    })

    // Also ensure that the original files are not mutated
    expect(files).toEqual(filesClone)
  })
})
