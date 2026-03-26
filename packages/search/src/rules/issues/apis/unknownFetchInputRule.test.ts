import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { unknownFetchInputRule } from './unknownFetchInputRule'

describe('find unknownFetchInputRule', () => {
  test('should report unknown api input overrides', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'Fetch',
                    api: 'my-api',
                    inputs: {
                      invalidInput: { formula: valueFormula('test') },
                    },
                    onSuccess: { actions: [] },
                    onError: { actions: [] },
                  },
                ],
              },
              nodes: {
                root: {
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
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {
                    validInput: {
                      formula: valueFormula(null),
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownFetchInputRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown fetch input')
    expect(problems[0].details).toEqual({ name: 'invalidInput' })
  })
  test('should not report valid api input overrides', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            test: {
              name: 'test',
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    type: 'Fetch',
                    api: 'my-api',
                    inputs: {
                      validInput: { formula: valueFormula('test') },
                    },
                    onSuccess: { actions: [] },
                    onError: { actions: [] },
                  },
                ],
              },
              nodes: {
                root: {
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
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(true),
                  inputs: {
                    validInput: {
                      formula: valueFormula(null),
                    },
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownFetchInputRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
})
describe('fix unknownFetchInputRule', () => {
  test('should remove unknown api input overrides', () => {
    const project: ProjectFiles = {
      formulas: {},
      components: {
        test: {
          name: 'test',
          onLoad: {
            trigger: 'onLoad',
            actions: [
              {
                type: 'Fetch',
                api: 'my-api',
                inputs: {
                  invalidInput: { formula: valueFormula('test') },
                  validInput: { formula: valueFormula('test') },
                },
                onSuccess: { actions: [] },
                onError: { actions: [] },
              },
            ],
          },
          nodes: {},
          formulas: {},
          apis: {
            'my-api': {
              name: 'my-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(true),
              inputs: {
                validInput: {
                  formula: valueFormula(null),
                },
              },
            },
          },
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: project,
      rule: unknownFetchInputRule,
      fixType: 'delete-fetch-input',
    })
    const fixedAction = fixedProject.components['test']?.onLoad?.actions?.[0]
    if (fixedAction?.type !== 'Fetch') {
      // To help Typescript narrow the type
      throw new Error('Fixed action is not a Fetch action')
    }
    expect(fixedAction.inputs!).toMatchObject({
      validInput: { formula: valueFormula('test') },
    })
  })
})
