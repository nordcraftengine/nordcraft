import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownActionArgumentRule } from './unknownActionArgumentRule'

describe('unknownActionArgumentRule', () => {
  test('should find invalid action arguments', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'legacy-action': {
              name: 'legacy-action',
              handler: '',
              arguments: [
                { name: 'arg1', formula: valueFormula(1) },
                { name: 'arg2', formula: valueFormula(2) },
              ],
              variableArguments: false,
            },
            'modern-action': {
              name: 'modern-action',
              handler: '',
              version: 2,
              arguments: [
                { name: 'arg1', formula: valueFormula(1) },
                { name: 'arg2', formula: valueFormula(2) },
              ],
              variableArguments: false,
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'legacy-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula(7) },
                      { name: 'arg2', formula: valueFormula(9) },
                      { name: 'arg3', formula: valueFormula(13) },
                    ],
                  },
                  {
                    name: 'modern-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula(7) },
                      { name: 'arg2', formula: valueFormula(9) },
                      { name: 'arg3', formula: valueFormula(13) },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [unknownActionArgumentRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown action argument')
    expect(problems[0].details).toEqual({ name: 'arg3' })
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '0',
      'arguments',
      2,
    ])
    expect(problems[1].code).toBe('unknown action argument')
    expect(problems[1].details).toEqual({ name: 'arg3' })
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '1',
      'arguments',
      2,
    ])
  })
  test('should not find valid action arguments', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'legacy-action': {
              name: 'legacy-action',
              handler: '',
              arguments: [
                { name: 'arg1', formula: valueFormula(1) },
                { name: 'arg2', formula: valueFormula(2) },
              ],
              variableArguments: false,
            },
            'modern-action': {
              name: 'modern-action',
              handler: '',
              version: 2,
              arguments: [
                { name: 'arg1', formula: valueFormula(1) },
                { name: 'arg2', formula: valueFormula(2) },
              ],
              variableArguments: false,
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'legacy-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula(7) },
                      { name: 'arg2', formula: valueFormula(9) },
                    ],
                  },
                  {
                    name: 'modern-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula(7) },
                      { name: 'arg2', formula: valueFormula(9) },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [unknownActionArgumentRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
