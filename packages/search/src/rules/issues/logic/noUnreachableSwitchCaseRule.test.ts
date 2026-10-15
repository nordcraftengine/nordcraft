import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noUnreachableSwitchCaseRule } from './noUnreachableSwitchCaseRule'

const componentWithFormula = (formula: any) => ({
  components: {
    test: {
      name: 'test',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: { title: formula },
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
    },
  },
})

describe('noUnreachableSwitchCaseRule', () => {
  test('should report cases after static always-true case', () => {
    const problems = Array.from(
      searchProject({
        files: componentWithFormula({
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
        }) as any,
        rules: [noUnreachableSwitchCaseRule],
      }),
    )
    // 1 unreachable case + unreachable default
    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-unreachable-switch-case')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'title',
      'cases',
      1,
    ])
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'title',
      'default',
    ])
  })

  test('should not report when no always-true case exists', () => {
    const problems = Array.from(
      searchProject({
        files: componentWithFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'value', value: false },
              formula: { type: 'value', value: 'a' },
            },
            {
              condition: {
                type: 'path',
                path: ['Variables', 'x'],
              },
              formula: { type: 'value', value: 'b' },
            },
          ],
          default: { type: 'value', value: 'c' },
        }) as any,
        rules: [noUnreachableSwitchCaseRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should report unreachable else when single-case condition is always true', () => {
    const problems = Array.from(
      searchProject({
        files: componentWithFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'value', value: true },
              formula: { type: 'value', value: 'then' },
            },
          ],
          default: { type: 'value', value: 'else' },
        }) as any,
        rules: [noUnreachableSwitchCaseRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-unreachable-switch-case')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'title',
      'default',
    ])
    expect(problems[0].info?.title).toBe('Unreachable else')
    expect(problems[0].info?.description).toContain(
      'never reached as the condition always evaluates to **true**',
    )
  })

  test('should report unreachable then when single-case condition is always false', () => {
    const problems = Array.from(
      searchProject({
        files: componentWithFormula({
          type: 'switch',
          cases: [
            {
              condition: { type: 'value', value: false },
              formula: { type: 'value', value: 'then' },
            },
          ],
          default: { type: 'value', value: 'else' },
        }) as any,
        rules: [noUnreachableSwitchCaseRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-unreachable-switch-case')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'title',
      'cases',
      0,
    ])
    expect(problems[0].info?.title).toBe('Unreachable then')
    expect(problems[0].info?.description).toContain(
      'never reached as the condition always evaluates to **false**',
    )
  })

  test('should not report single-case when condition is dynamic', () => {
    const problems = Array.from(
      searchProject({
        files: componentWithFormula({
          type: 'switch',
          cases: [
            {
              condition: {
                type: 'path',
                path: ['Variables', 'x'],
              },
              formula: { type: 'value', value: 'then' },
            },
          ],
          default: { type: 'value', value: 'else' },
        }) as any,
        rules: [noUnreachableSwitchCaseRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should ignore action-model Switch (handled by action rule)', () => {
    const files: any = {
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
                  actions: [
                    {
                      type: 'Switch',
                      cases: [
                        {
                          condition: { type: 'value', value: true },
                          actions: [],
                        },
                        {
                          condition: { type: 'value', value: true },
                          actions: [],
                        },
                      ],
                      default: { actions: [] },
                    },
                  ],
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
      searchProject({ files, rules: [noUnreachableSwitchCaseRule] }),
    )
    expect(problems).toBeEmpty()
  })
})
