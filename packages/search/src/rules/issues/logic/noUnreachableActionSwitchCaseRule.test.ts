import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noUnreachableActionSwitchCaseRule } from './noUnreachableActionSwitchCaseRule'

const switchAction = (cases: any[], withDefault = true): any => ({
  type: 'Switch',
  cases,
  ...(withDefault
    ? {
        default: {
          actions: [
            {
              type: 'SetVariable',
              variable: 'x',
              data: { type: 'value', value: 3 },
            },
          ],
        },
      }
    : {}),
})

const filesWithSwitchAction = (action: any): any => ({
  components: {
    test: {
      name: 'test',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          events: {
            onClick: {
              trigger: 'click',
              actions: [action],
            },
          },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
    },
  },
})

const caseWith = (conditionValue: unknown) => ({
  condition: { type: 'value', value: conditionValue },
  actions: [
    {
      type: 'SetVariable',
      variable: 'x',
      data: { type: 'value', value: 1 },
    },
  ],
})

describe('noUnreachableActionSwitchCaseRule', () => {
  test('should report cases after static always-true case', () => {
    const problems = Array.from(
      searchProject({
        files: filesWithSwitchAction(
          switchAction([caseWith(true), caseWith(true)]),
        ),
        rules: [noUnreachableActionSwitchCaseRule],
      }),
    )
    // 1 unreachable case + unreachable default
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-unreachable-action-switch-case')
    expect(problems[1].code).toBe('no-unreachable-action-switch-case')
  })

  test('should report unreachable action cases after always-true', () => {
    const files = filesWithSwitchAction(
      switchAction([caseWith(true), caseWith(false)]),
    )
    const problems = Array.from(
      searchProject({ files, rules: [noUnreachableActionSwitchCaseRule] }),
    )
    expect(problems.length).toBeGreaterThanOrEqual(1)
    expect(problems[0].code).toBe('no-unreachable-action-switch-case')
  })

  test('should not report when no always-true case exists', () => {
    const problems = Array.from(
      searchProject({
        files: filesWithSwitchAction(
          switchAction([
            caseWith(false),
            {
              condition: { type: 'path', path: ['Variables', 'x'] },
              actions: [],
            },
          ]),
        ),
        rules: [noUnreachableActionSwitchCaseRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should not report unreachable default when no default exists', () => {
    const problems = Array.from(
      searchProject({
        files: filesWithSwitchAction(
          switchAction([caseWith(true), caseWith(true)], false),
        ),
        rules: [noUnreachableActionSwitchCaseRule],
      }),
    )
    // Only the second case is unreachable, no default to report
    expect(problems).toHaveLength(1)
    expect(problems[0].path.slice(-2)).toEqual(['cases', 1])
  })

  test('should ignore formula switches', () => {
    const files: any = {
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              attrs: {
                title: {
                  type: 'switch',
                  cases: [
                    {
                      condition: { type: 'value', value: true },
                      formula: { type: 'value', value: 'a' },
                    },
                    {
                      condition: { type: 'value', value: true },
                      formula: { type: 'value', value: 'b' },
                    },
                  ],
                  default: { type: 'value', value: 'c' },
                },
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
    const problems = Array.from(
      searchProject({ files, rules: [noUnreachableActionSwitchCaseRule] }),
    )
    expect(problems).toBeEmpty()
  })
})
