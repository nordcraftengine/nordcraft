import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { unknownActionArgumentRule } from './unknownActionArgumentRule'

describe('finds unknownActionArgumentRule', () => {
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

describe('fix unknownActionArgumentRule', () => {
  test('should fix invalid action arguments', () => {
    const fixedProject = fixProject({
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
                    { name: 'arg3', formula: valueFormula(13) },
                    { name: 'arg2', formula: valueFormula(9) },
                  ],
                },
              ],
            },
          },
        },
      },
      rule: unknownActionArgumentRule,
      fixType: 'delete-unknown-action-argument',
      state: {},
    })

    expect(
      (fixedProject.components['test']?.onLoad?.actions[0] as CustomActionModel)
        .arguments,
    ).toEqual([
      {
        formula: {
          type: 'value',
          value: 7,
        },
        name: 'arg1',
      },
      {
        formula: {
          type: 'value',
          value: 9,
        },
        name: 'arg2',
      },
    ])
    expect(
      (fixedProject.components['test']?.onLoad?.actions[1] as CustomActionModel)
        .arguments,
    ).toEqual([
      {
        formula: {
          type: 'value',
          value: 7,
        },
        name: 'arg1',
      },
      {
        formula: {
          type: 'value',
          value: 9,
        },
        name: 'arg2',
      },
    ])
  })
  test('should not remove valid action arguments', () => {
    const files = {
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
    }
    const fixedProject = fixProject({
      files,
      rule: unknownActionArgumentRule,
      fixType: 'delete-unknown-action-argument',
      state: {},
    })
    expect(fixedProject).toEqual(files)
  })
})
