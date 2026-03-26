import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceAttributeInInstanceRule } from './noReferenceAttributeInInstanceRule'

describe('noReferenceAttributeInInstanceRule', () => {
  test('should detect attributes that are never used in any instance', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute-name',
                  testValue: { type: 'value', value: null },
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              variables: {
                'my-variable': {
                  initialValue: {
                    type: 'path',
                    path: ['Attributes', 'my-attribute'],
                  },
                },
              },
            },
            other: {
              name: 'other',
              nodes: {
                root: {
                  type: 'component',
                  name: 'test',
                  attrs: {},
                  children: [],
                  events: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeInInstanceRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference attribute in instance')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'attributes',
      'my-attribute',
    ])
  })
  test('should not detect if component is never instantiated (we already have a rule to find unused components)', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute-name',
                  testValue: { type: 'value', value: null },
                },
              },
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeInInstanceRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect if component is exported as a web component', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute-name',
                  testValue: { type: 'value', value: null },
                },
              },
              variables: {},
              customElement: {
                enabled: {
                  type: 'value',
                  value: true,
                },
              },
            },
            other: {
              name: 'other',
              nodes: {
                root: {
                  type: 'component',
                  name: 'test',
                  attrs: {},
                  children: [],
                  events: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeInInstanceRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect if project is a package and component is exported', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                'my-attribute': {
                  name: 'my-attribute-name',
                  testValue: { type: 'value', value: null },
                },
              },
              variables: {},
              exported: true,
            },
            other: {
              name: 'other',
              nodes: {
                root: {
                  type: 'component',
                  name: 'test',
                  attrs: {},
                  children: [],
                  events: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceAttributeInInstanceRule],
        state: {
          projectDetails: {
            type: 'package',
            id: 'my-package',
            name: 'My Package',
            short_id: 'my-package',
          },
        },
      }),
    )

    expect(problems).toEqual([])
  })

  test('should fix by removing the attribute', () => {
    const fixedProject = fixProject({
      files: {
        formulas: {},
        components: {
          test: {
            name: 'test',
            nodes: {},
            formulas: {},
            apis: {},
            attributes: {
              'my-attribute': {
                name: 'my-attribute-name',
                testValue: { type: 'value', value: null },
              },
            },
            variables: {},
          },
          other: {
            name: 'other',
            nodes: {
              root: {
                type: 'component',
                name: 'test',
                attrs: {},
                children: [],
                events: {},
              },
            },
            formulas: {},
            apis: {},
            attributes: {},
            variables: {},
          },
        },
      },
      fixType: 'delete-attribute',
      rule: noReferenceAttributeInInstanceRule,
      state: {},
    })

    expect(
      fixedProject.components.test?.attributes?.['my-attribute'],
    ).toBeUndefined()
  })
})
