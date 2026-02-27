import { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceAnimationRule } from './noReferenceAnimationRule'

describe('noReferenceAnimationRule', () => {
  test('should detect unused animations', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            'my-component': {
              name: 'my-component',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  events: {},
                  style: {
                    animation: 'fade-in 1s ease-in-out',
                  },
                  animations: {
                    'fade-in': {
                      a: {
                        key: 'opacity',
                        value: '1',
                        position: 1,
                      },
                    },
                    'fade-out': {
                      a: {
                        key: 'opacity',
                        value: '0',
                        position: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceAnimationRule],
      }),
    )

    expect(problems).toMatchObject([
      {
        code: 'no-reference animation',
        path: [
          'components',
          'my-component',
          'nodes',
          'root',
          'animations',
          'fade-out',
        ],
      },
    ])
  })

  test('should not report when all animations are used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            'my-component': {
              name: 'my-component',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  events: {},
                  style: {
                    animation:
                      'fade-in 1s ease-in-out, fade-out 1s ease-in-out',
                  },
                  animations: {
                    'fade-in': {
                      a: {
                        key: 'opacity',
                        value: '1',
                        position: 1,
                      },
                    },
                    'fade-out': {
                      a: {
                        key: 'opacity',
                        value: '0',
                        position: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceAnimationRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report when animation is used in any variants, and when animation is used through the animation-name property', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            'my-component': {
              name: 'my-component',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  events: {},
                  variants: [
                    {
                      hover: true,
                      style: {
                        animation: 'fade-out 1s ease-in-out',
                      },
                    },
                    {
                      active: true,
                      style: {
                        'animation-name': 'fade-in',
                      },
                    },
                  ],
                  animations: {
                    'fade-in': {
                      a: {
                        key: 'opacity',
                        value: '1',
                        position: 1,
                      },
                    },
                    'fade-out': {
                      a: {
                        key: 'opacity',
                        value: '0',
                        position: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceAnimationRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should detect used animations in variants', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            'my-component': {
              name: 'my-component',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  children: [],
                  events: {},
                  style: {},
                  variants: [
                    {
                      hover: true,
                      style: {
                        animation: 'fade-in 1s ease-in-out',
                      },
                    },
                  ],
                  animations: {
                    'fade-in': {
                      a: {
                        key: 'opacity',
                        value: '1',
                        position: 1,
                      },
                    },
                    'fade-out': {
                      a: {
                        key: 'opacity',
                        value: '0',
                        position: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceAnimationRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'my-component',
      'nodes',
      'root',
      'animations',
      'fade-out',
    ])
  })
})

describe('noReferenceAnimationRule fixes', () => {
  test('delete-animation should remove the animation from the node', () => {
    const files: ProjectFiles = {
      components: {
        'my-component': {
          name: 'my-component',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {},
              children: [],
              events: {},
              style: {},
              animations: {
                'fade-out': {
                  a: {
                    key: 'opacity',
                    value: '0',
                    position: 1,
                  },
                },
              },
            },
          },
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files,
        rules: [noReferenceAnimationRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'my-component',
      'nodes',
      'root',
      'animations',
      'fade-out',
    ])

    const fixedFiles = fixProject({
      files,
      rule: noReferenceAnimationRule,
      fixType: 'delete-animation',
    })

    expect(
      (fixedFiles.components['my-component']?.nodes as any).root.animations,
    ).toEqual({})
  })
})
