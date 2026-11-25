import type {
  ActionModel,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { legacyCustomActionRule } from './legacyCustomActionRule'

describe('find legacy custom actions', () => {
  test('should detect custom actions without version 2', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          actions: {
            'my-action': {
              name: 'my-action',
              handler: 'function myaction() {}',
              version: 2,
              arguments: [{ name: 'arg1', formula: valueFormula(1) }],
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
                trigger: 'Load',
                actions: [
                  {
                    name: 'my-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula('hello') },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [legacyCustomActionRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('legacy custom action')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '0',
    ])
  })
  test('should detect typeless legacy custom actions', () => {
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
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [{ name: 'MyLegacyCustomAction' }],
              },
            },
          },
        },
        rules: [legacyCustomActionRule],
      }),
    )
    expect(problems).toHaveLength(1)
  })
  test('should not detect v2 custom actions', () => {
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
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    type: 'Custom',
                    version: 2,
                    name: 'my-action',
                    arguments: [
                      { name: 'arg1', formula: valueFormula('hello') },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [legacyCustomActionRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
  test('should not detect builtin actions or builtin types', () => {
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
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    name: '@toddle/logToConsole',
                    arguments: [
                      { name: 'Label', formula: valueFormula('') },
                      { name: 'Data', formula: valueFormula('hi') },
                    ],
                    label: 'Log to console',
                  },
                  {
                    type: 'SetVariable',
                    variable: 'myVar',
                    data: valueFormula('hi'),
                  },
                ],
              },
            },
          },
        },
        rules: [legacyCustomActionRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
  test('should not duplicate legacy builtin actions (handled by legacy action rule)', () => {
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
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    name: 'If',
                    arguments: [
                      { name: 'Condition', formula: valueFormula(true) },
                    ],
                    events: { true: { actions: [] }, false: { actions: [] } },
                  },
                ],
              },
            },
          },
        },
        rules: [legacyCustomActionRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
})

describe('fix legacy custom actions', () => {
  test('should upgrade legacy action to version 2 with type Custom', () => {
    const legacyAction: ActionModel = {
      name: 'my-action',
      arguments: [{ name: 'arg1', formula: valueFormula('hello') }],
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      actions: {
        'my-action': {
          name: 'my-action',
          handler: 'function myaction() {}',
          version: 2,
          arguments: [{ name: 'arg1', formula: valueFormula(1) }],
          variableArguments: false,
        },
      },
      components: {
        test: {
          name: 'test',
          nodes: {
            root: {
              tag: 'p',
              type: 'element',
              attrs: {},
              style: {},
              events: {
                click: { trigger: 'click', actions: [legacyAction] },
              },
              classes: {},
              children: [],
            },
          },
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: projectFiles,
      rule: legacyCustomActionRule,
      fixType: 'upgrade-custom-action',
    })
    const fixedAction = (
      fixedProject.components['test']?.nodes?.['root'] as ElementNodeModel
    ).events['click']?.actions?.[0] as ActionModel
    expect(fixedAction).toEqual({
      type: 'Custom',
      version: 2,
      name: 'my-action',
      arguments: [{ name: 'arg1', formula: valueFormula('hello') }],
    })
    // Fix should be idempotent (no more problems after fix)
    const problemsAfter = Array.from(
      searchProject({ files: fixedProject, rules: [legacyCustomActionRule] }),
    )
    expect(problemsAfter).toBeEmpty()
  })
  test('should remap positional argument names by index', () => {
    const legacyAction: ActionModel = {
      name: 'my-action',
      arguments: [
        { name: 'wrong-name', formula: valueFormula('hello') },
        { name: 'other', formula: valueFormula(42) },
      ],
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      actions: {
        'my-action': {
          name: 'my-action',
          handler: 'function myaction() {}',
          version: 2,
          arguments: [
            { name: 'first', formula: valueFormula(1) },
            { name: 'second', formula: valueFormula(2) },
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
          onLoad: { trigger: 'onLoad', actions: [legacyAction] },
        },
      },
    }
    const fixedProject = fixProject({
      files: projectFiles,
      rule: legacyCustomActionRule,
      fixType: 'upgrade-custom-action',
    })
    const fixedAction = fixedProject.components['test']?.onLoad
      ?.actions?.[0] as ActionModel
    expect(fixedAction).toEqual({
      type: 'Custom',
      version: 2,
      name: 'my-action',
      arguments: [
        { name: 'first', formula: valueFormula('hello') },
        { name: 'second', formula: valueFormula(42) },
      ],
    })
  })
  test('should convert legacy data field to first argument', () => {
    const legacyAction: ActionModel = {
      name: 'my-action',
      data: valueFormula('hello'),
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      actions: {
        'my-action': {
          name: 'my-action',
          handler: 'function myaction() {}',
          version: 2,
          arguments: [{ name: 'input', formula: valueFormula('') }],
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
          onLoad: { trigger: 'onLoad', actions: [legacyAction] },
        },
      },
    }
    const fixedProject = fixProject({
      files: projectFiles,
      rule: legacyCustomActionRule,
      fixType: 'upgrade-custom-action',
    })
    const fixedAction = fixedProject.components['test']?.onLoad
      ?.actions?.[0] as ActionModel
    expect(fixedAction).toEqual({
      type: 'Custom',
      version: 2,
      name: 'my-action',
      arguments: [{ name: 'input', formula: valueFormula('hello') }],
    })
  })
})
