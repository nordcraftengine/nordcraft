import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { duplicateActionArgumentNameRule } from './duplicateActionArgumentNameRule'

describe('duplicateActionArgumentNameRule', () => {
  test('should detect duplicate argument names in actions', () => {
    const files: ProjectFiles = {
      actions: {
        myAction: {
          name: 'myAction',
          variableArguments: false,
          arguments: [
            {
              name: 'arg1',
              formula: valueFormula(null),
            },
            {
              name: 'arg2',
              formula: valueFormula(null),
            },
            {
              name: 'arg1', // Duplicate
              formula: valueFormula(null),
            },
          ],
          handler: '',
          version: 2,
        },
      },
      components: {},
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [duplicateActionArgumentNameRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('duplicate action argument name')
    expect(problems[0].details).toEqual({ name: 'arg1' })
    expect(problems[0].path).toEqual(['actions', 'myAction'])
  })
  test('should not report when all argument names are unique', () => {
    const files: ProjectFiles = {
      actions: {
        uniqueArgsAction: {
          name: 'uniqueArgsAction',
          variableArguments: false,
          arguments: [
            { name: 'arg1', formula: valueFormula(null) },
            { name: 'arg2', formula: valueFormula(null) },
            { name: 'arg3', formula: valueFormula(null) },
          ],
          handler: '',
          version: 2,
        },
      },
      components: {},
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [duplicateActionArgumentNameRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should not report when there are no arguments', () => {
    const files: ProjectFiles = {
      actions: {
        noArgsAction: {
          name: 'noArgsAction',
          variableArguments: false,
          arguments: [],
          handler: '',
          version: 2,
        },
      },
      components: {},
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [duplicateActionArgumentNameRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should not report when arguments is undefined', () => {
    const files: ProjectFiles = {
      actions: {
        undefinedArgsAction: {
          name: 'undefinedArgsAction',
          variableArguments: false,
          handler: '',
          version: 2,
        } as any, // Force arguments to be undefined
      },
      components: {},
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [duplicateActionArgumentNameRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should report multiple duplicates', () => {
    const files: ProjectFiles = {
      actions: {
        multiDupAction: {
          name: 'multiDupAction',
          variableArguments: false,
          arguments: [
            { name: 'arg1', formula: valueFormula(null) },
            { name: 'arg2', formula: valueFormula(null) },
            { name: 'arg1', formula: valueFormula(null) }, // Duplicate
            { name: 'arg2', formula: valueFormula(null) }, // Duplicate
            { name: 'arg3', formula: valueFormula(null) },
            { name: 'arg1', formula: valueFormula(null) }, // Duplicate
          ],
          handler: '',
          version: 2,
        },
      },
      components: {},
    }
    const problems = Array.from(
      searchProject({
        files,
        rules: [duplicateActionArgumentNameRule],
      }),
    )
    expect(problems).toHaveLength(3)
    expect(problems[0].details).toEqual({ name: 'arg1' })
    expect(problems[1].details).toEqual({ name: 'arg2' })
    expect(problems[2].details).toEqual({ name: 'arg1' })
  })
})
