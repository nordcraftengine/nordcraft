import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import { createFieldSearchRule } from './fieldSearchRule'

describe('fieldSearchRule', () => {
  const files: ProjectFiles = {
    formulas: {},
    components: {
      test: {
        name: 'test',
        nodes: {
          myNode: {
            type: 'element',
            tag: 'div',
            attrs: {
              alt: {
                type: 'and',
                arguments: [
                  {
                    formula: {
                      type: 'function',
                      name: 'myFormula',
                      arguments: [],
                    },
                  },
                ],
              },
            },
            children: [],
            events: {},
          },
        },
        formulas: {
          myFormula: {
            name: 'myFormula',
            formula: {
              type: 'function',
              name: 'myFormula',
              arguments: [],
              '@nordcraft/metadata': {
                comments: {
                  0: {
                    index: 0,
                    text: 'This is a comment',
                  },
                },
              },
            },
          },
        },
        apis: {},
        attributes: {},
        variables: {},
        route: {
          path: [],
          query: {},
        },
        workflows: {},
      },
    },
  }

  test('it should find nodes with programmatic search', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<formula>name:"myFormula"',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(2)
  })

  test('it should find nodes with programmatic search and empty nodeType', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<>tag:"div"',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(1)
  })

  test('it should find nodes with plain text search', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: 'myForm',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(3)
  })

  test('it should find nodes with plain text search (exact match with quotes)', () => {
    const resultsWithSubstring = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '"myForm"',
          }),
        ],
      }),
    )
    const resultExactMatch = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '"myFormula"',
          }),
        ],
      }),
    )

    expect(resultsWithSubstring).toHaveLength(0)
    expect(resultExactMatch).toHaveLength(3)
  })

  test('it should find nodes with regex in programmatic search', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<>tag:"div" attrs.alt.arguments.0.formula.name:"/my.*/"',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual(['components', 'test', 'nodes', 'myNode'])
  })

  test('it should find path formulas with array match (Variable,my-var)', () => {
    const _files = {
      components: {
        test: {
          name: 'test',
          nodes: {},
          formulas: {
            myFormula: {
              name: 'myFormula',
              formula: {
                type: 'path',
                path: ['Variables', 'my-var', 'field'],
              } as any,
            },
          },
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    } as any
    const results1 = Array.from(
      searchProject({
        withDetails: true,
        files: _files,
        rules: [
          createFieldSearchRule({
            // Should work with or without whitespace after the comma
            query: 'Variables, my-var',
          }),
        ],
      }),
    )
    const results2 = Array.from(
      searchProject({
        withDetails: true,
        files: _files,
        rules: [
          createFieldSearchRule({
            query: 'Variables,my-var',
          }),
        ],
      }),
    )

    expect(results1).toHaveLength(1)
    expect(results1[0].path).toEqual([
      'components',
      'test',
      'formulas',
      'myFormula',
      'formula',
    ])
    expect(results2).toHaveLength(1)
    expect(results2[0].path).toEqual([
      'components',
      'test',
      'formulas',
      'myFormula',
      'formula',
    ])
  })

  // Programmatic search requires more work
  test.failing(
    'it should be able to precisely find path formulas with array match and exact match quotes',
    () => {
      const results = Array.from(
        searchProject({
          withDetails: true,
          files: {
            components: {
              test: {
                name: 'test',
                nodes: {},
                formulas: {
                  myFormula: {
                    name: 'myFormula',
                    formula: {
                      type: 'path',
                      path: ['Variables', 'my-var', 'field'],
                    } as any,
                  },
                  myOtherFormula: {
                    name: 'myOtherFormula',
                    formula: {
                      type: 'path',
                      path: ['Variables', 'my-var-other', 'field'],
                    } as any,
                  },
                },
                apis: {},
                attributes: {},
                variables: {},
              },
            },
          } as any,
          rules: [
            createFieldSearchRule({
              // It should only match the formula where the path starts with the exact values "Variables" and "my-var", not include other formulas that stringified include those values but aren't an exact match on the array
              query: '<formula>type:"path" path:["Variables", "my-var"]',
            }),
          ],
        }),
      )

      expect(results).toHaveLength(1)
      expect(results[0].path).toEqual([
        'components',
        'test',
        'formulas',
        'myFormula',
        'formula',
      ])
    },
  )

  test('it should find nodes with plain text search (includes)', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFieldSearchRule({
            query: 'formula',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(3)
  })

  test('it should find nodes with case-sensitive regex', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFieldSearchRule({
            query: '/myFormula/',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(3)

    const results2 = Array.from(
      searchProject({
        files,
        rules: [
          createFieldSearchRule({
            query: '/myformula/',
          }),
        ],
      }),
    )
    expect(results2).toHaveLength(0)
  })

  test('it should find nodes with complex object fields', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFieldSearchRule({
            query: '<formula>@nordcraft/metadata.comments.0.text:comment',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(3)
    expect(results[0].path).toEqual([
      'components',
      'test',
      'formulas',
      'myFormula',
      'formula',
    ])
  })

  test('it should find nodes with complex object exact match', () => {
    const results = Array.from(
      searchProject({
        files,
        rules: [
          createFieldSearchRule({
            query:
              '<formula>@nordcraft/metadata.comments.0.text:"This is a comment"',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(1)
    expect(results[0].path).toEqual([
      'components',
      'test',
      'formulas',
      'myFormula',
      'formula',
    ])
  })

  test('it has details when withDetails is true', () => {
    const results = Array.from(
      searchProject({
        withDetails: true,
        files,
        rules: [
          createFieldSearchRule({
            query: 'Form',
          }),
        ],
      }),
    )

    expect(results).toHaveLength(3)
    expect(results[1].details.context).toEqual({
      before: 'my',
      matched: 'Form',
      after: 'ula',
    })
    expect(results[1].details.field).toEqual('name')
  })

  test('it should not report from skipped fields', () => {
    const filesWithChildren: ProjectFiles = {
      ...files,
      components: {
        test: {
          ...files.components.test,
          name: 'test',
          nodes: {
            ...files.components.test?.nodes,
            myNode: {
              ...files.components.test?.nodes?.myNode,
              children: ['_xyz_'],
              attrs: {},
              events: {},
              tag: 'div',
              type: 'element',
              classes: {
                myClass: {},
              },
            },
          },
        },
      },
    }
    const results = Array.from(
      searchProject({
        withDetails: true,
        files: filesWithChildren as any,
        rules: [
          createFieldSearchRule({
            query: 'xyz',
            skippedFields: {
              'component-node': ['children'],
            },
          }),
        ],
      }),
    )
    expect(results).toBeEmpty()
  })
})
