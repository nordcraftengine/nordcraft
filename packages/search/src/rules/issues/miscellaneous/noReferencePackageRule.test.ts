import type { ProjectFiles } from '@nordcraft/ssr/src/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceProjectPackageRule } from './noReferencePackageRule'

describe('noReferenceProjectPackageRule', () => {
  test('should report when no formula, actions or components from a package is used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {},
          packages: {
            'my-pkg': {
              manifest: { name: 'my-pkg', commit: 'abc' },
              formulas: {
                f1: {
                  name: 'f1',
                  exported: true,
                  arguments: [],
                  formula: { type: 'value', value: 1 },
                },
              },
              actions: {
                a1: {
                  name: 'a1',
                  version: 2,
                  exported: true,
                  handler: () => {},
                  variableArguments: false,
                },
              },
              components: {
                c1: {
                  name: 'c1',
                  exported: true,
                  nodes: {
                    root: {
                      type: 'element',
                      tag: 'div',
                      children: [],
                      attrs: {},
                      style: {},
                      events: {},
                      classes: {},
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual(['packages', 'my-pkg'])
  })

  test('should not report if just one formula is used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            comp: {
              name: 'comp',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  children: [],
                  attrs: {},
                  style: {},
                  events: {
                    onClick: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'SetVariable',
                          variable: 'v1',
                          data: {
                            type: 'function',
                            name: 'f1',
                            package: 'my-pkg',
                            arguments: [],
                          },
                        },
                      ],
                    },
                  },
                  classes: {},
                },
              },
            },
          },
          packages: {
            'my-pkg': {
              manifest: { name: 'my-pkg', commit: 'abc' },
              formulas: {
                f1: {
                  name: 'f1',
                  exported: true,
                  arguments: [],
                  formula: { type: 'value', value: 1 },
                },
              },
              actions: {},
              components: {},
            },
          },
        },
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report if just one action is used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            comp: {
              name: 'comp',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'button',
                  children: [],
                  attrs: {},
                  style: {},
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          type: 'Custom',
                          name: 'a1',
                          package: 'my-pkg',
                          arguments: [],
                        },
                      ],
                    },
                  },
                  classes: {},
                },
              },
            },
          },
          packages: {
            'my-pkg': {
              manifest: { name: 'my-pkg', commit: 'abc' },
              formulas: {},
              actions: {
                a1: {
                  name: 'a1',
                  version: 2,
                  exported: true,
                  handler: () => {},
                  variableArguments: false,
                },
              },
              components: {},
            },
          },
        },
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should not report if just one component is used', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            main: {
              name: 'main',
              nodes: {
                root: {
                  type: 'component',
                  name: 'c1',
                  package: 'my-pkg',
                  attrs: {},
                  children: [],
                  events: {},
                },
              },
            },
          },
          packages: {
            'my-pkg': {
              manifest: { name: 'my-pkg', commit: 'abc' },
              formulas: {},
              actions: {},
              components: {
                c1: {
                  name: 'c1',
                  exported: true,
                  nodes: {
                    root: {
                      type: 'element',
                      tag: 'div',
                      children: [],
                      attrs: {},
                      style: {},
                      events: {},
                      classes: {},
                    },
                  },
                },
              },
            },
          },
        },
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })

  test('should report when a package has no components, actions or formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {},
          packages: {
            'empty-pkg': {
              manifest: { name: 'empty-pkg', commit: 'abc' },
              formulas: {},
              actions: {},
              components: {},
            },
          },
        },
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual(['packages', 'empty-pkg'])
  })
})

describe('fix noReferenceProjectPackageRule', () => {
  test('should remove unreferenced package', () => {
    const project: ProjectFiles = {
      formulas: {},
      components: {},
      packages: {
        'my-pkg': {
          manifest: { name: 'my-pkg', commit: 'abc' },
          formulas: {},
          actions: {},
          components: {},
        },
      },
    }

    const problems = Array.from(
      searchProject({
        files: project,
        rules: [noReferenceProjectPackageRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference project package')
    expect(problems[0].fixes).toEqual(['uninstall-package'])

    const fixedProject = fixProject({
      files: project,
      rule: noReferenceProjectPackageRule,
      fixType: 'uninstall-package',
    })

    expect(fixedProject.packages).toEqual({})
  })
})
