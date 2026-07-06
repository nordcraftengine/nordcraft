import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { IssueResult } from '../../../types'
import { invalidInitialValueGlobalCSSVariableRule } from './invalidInitialValueGlobalCSSVariable'

describe('invalidInitialValueGlobalCSSVariableRule', () => {
  test('should report invalid initial values and var() references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--invalid-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'Invalid color',
                  inherits: true,
                  initialValue: '123px', // Invalid for color
                  values: {},
                },
                '--var-ref': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'Var reference',
                  inherits: true,
                  initialValue: 'var(--some-other)', // Now invalid
                  values: {},
                },
                '--valid-color': {
                  syntax: { type: 'primitive', name: 'color' },
                  description: 'Valid color',
                  inherits: true,
                  initialValue: 'red',
                  values: {},
                },
                '--null-value': {
                  syntax: { type: 'primitive', name: 'length' },
                  description: 'Null value',
                  inherits: true,
                  initialValue: null,
                  values: {},
                },
                '--empty-value': {
                  syntax: { type: 'primitive', name: 'length' },
                  description: 'Empty value',
                  inherits: true,
                  initialValue: '',
                  values: {},
                },
              },
            },
          },
          formulas: {},
          components: {},
          actions: {},
          services: {},
          routes: {},
        } as any,
        rules: [invalidInitialValueGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect((problems[0] as IssueResult).info.title).toBe(
      'Invalid initial value for --invalid-color',
    )
    expect((problems[1] as IssueResult).info.title).toBe(
      'Invalid initial value for --var-ref',
    )
  })

  test('should not report valid initial values', () => {
    const problems = Array.from(
      searchProject({
        files: {
          themes: {
            Default: {
              fonts: [],
              propertyDefinitions: {
                '--valid-length': {
                  syntax: { type: 'primitive', name: 'length' },
                  description: 'Valid length',
                  inherits: true,
                  initialValue: '10px',
                  values: {},
                },
              },
            },
          },
          formulas: {},
          components: {},
          actions: {},
          services: {},
          routes: {},
        } as any,
        rules: [invalidInitialValueGlobalCSSVariableRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
