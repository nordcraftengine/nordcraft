import type {
  ActionModel,
  ElementNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../fixProject'
import { searchProject } from '../../searchProject'
import { legacyActionRule } from './legacyActionRule'

describe('find legacyActions', () => {
  test('should detect legacy actions used in components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
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
                    events: {
                      true: {
                        actions: [],
                      },
                      false: {
                        actions: [],
                      },
                    },
                    arguments: [
                      {
                        name: 'Condition',
                        formula: {
                          type: 'value',
                          value: true,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        rules: [legacyActionRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'onLoad',
      'actions',
      '0',
    ])
  })
  test('should not detect non-legacy actions used in components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
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
                    type: 'Fetch',
                    api: 'my-api',
                    inputs: {},
                    onSuccess: { actions: [] },
                    onError: { actions: [] },
                  },
                ],
              },
            },
          },
        },
        rules: [legacyActionRule],
      }),
    )
    expect(problems).toHaveLength(0)
  })
})

describe('fix legacyActions', () => {
  test('should replace the If action with a Switch action', () => {
    const legacyIfAction: ActionModel = {
      name: 'If',
      events: {
        true: {
          actions: [
            {
              name: '@toddle/logToConsole',
              arguments: [
                {
                  name: 'Label',
                  description: 'A label for the message.',
                  formula: { type: 'value', value: '' },
                },
                {
                  name: 'Data',
                  type: { type: 'Any' },
                  description: 'The data you want to log to the console.',
                  formula: {
                    type: 'value',
                    value: '<Data>',
                  },
                },
              ],
              label: 'Log to console',
              group: 'debugging',
              description: 'Log a message to the browser console.',
            },
          ],
        },
        false: {
          actions: [
            {
              name: '@toddle/logToConsole',
              arguments: [
                {
                  name: 'Label',
                  description: 'A label for the message.',
                  formula: { type: 'value', value: '' },
                },
                {
                  name: 'Data',
                  type: { type: 'Any' },
                  description: 'The data you want to log to the console.',
                  formula: {
                    type: 'value',
                    value: '<Data>',
                  },
                },
              ],
              label: 'Log to console',
              group: 'debugging',
              description: 'Log a message to the browser console.',
            },
          ],
        },
      },
      arguments: [
        {
          name: 'Condition',
          formula: { type: 'value', value: true },
        },
      ],
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      components: {
        apiComponent: {
          name: 'test',
          nodes: {
            root: {
              tag: 'p',
              type: 'element',
              attrs: {},
              style: {},
              events: {
                click: {
                  trigger: 'click',
                  actions: [legacyIfAction],
                },
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
      rule: legacyActionRule,
      fixType: 'replace-legacy-action',
    })
    const fixedAction = (
      fixedProject.components['apiComponent']?.nodes['root'] as ElementNodeModel
    ).events['click'].actions[0]
    expect(fixedAction).toMatchInlineSnapshot(`
      {
        "cases": [
          {
            "actions": [
              {
                "arguments": [
                  {
                    "description": "A label for the message.",
                    "formula": {
                      "type": "value",
                      "value": "",
                    },
                    "name": "Label",
                  },
                  {
                    "description": "The data you want to log to the console.",
                    "formula": {
                      "type": "value",
                      "value": "<Data>",
                    },
                    "name": "Data",
                    "type": {
                      "type": "Any",
                    },
                  },
                ],
                "description": "Log a message to the browser console.",
                "group": "debugging",
                "label": "Log to console",
                "name": "@toddle/logToConsole",
              },
            ],
            "condition": {
              "type": "value",
              "value": true,
            },
          },
        ],
        "default": {
          "actions": [
            {
              "arguments": [
                {
                  "description": "A label for the message.",
                  "formula": {
                    "type": "value",
                    "value": "",
                  },
                  "name": "Label",
                },
                {
                  "description": "The data you want to log to the console.",
                  "formula": {
                    "type": "value",
                    "value": "<Data>",
                  },
                  "name": "Data",
                  "type": {
                    "type": "Any",
                  },
                },
              ],
              "description": "Log a message to the browser console.",
              "group": "debugging",
              "label": "Log to console",
              "name": "@toddle/logToConsole",
            },
          ],
        },
        "type": "Switch",
      }
    `)
  })
  test('should replace the TriggerEvent action with the builtin action', () => {
    const legacyAction: ActionModel = {
      name: 'TriggerEvent',
      arguments: [
        {
          name: 'name',
          formula: { type: 'value', value: 'sdfsdf' },
        },
        {
          name: 'data',
          formula: { type: 'value', value: 'test' },
        },
      ],
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      components: {
        apiComponent: {
          name: 'test',
          nodes: {
            root: {
              tag: 'p',
              type: 'element',
              attrs: {},
              style: {},
              events: {
                click: {
                  trigger: 'click',
                  actions: [legacyAction],
                },
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
      rule: legacyActionRule,
      fixType: 'replace-legacy-action',
    })
    const fixedAction = (
      fixedProject.components['apiComponent']?.nodes['root'] as ElementNodeModel
    ).events['click'].actions[0]
    expect(fixedAction).toMatchInlineSnapshot(`
      {
        "data": {
          "type": "value",
          "value": "test",
        },
        "event": "sdfsdf",
        "type": "TriggerEvent",
      }
    `)
  })
  test('should replace the TriggerEvent action with the builtin action', () => {
    const legacyAction: ActionModel = {
      name: 'FocusElement',
      arguments: [
        {
          name: 'elementId',
          formula: { type: 'value', value: 'my-id' },
        },
      ],
    }
    const projectFiles: ProjectFiles = {
      formulas: {},
      components: {
        apiComponent: {
          name: 'test',
          nodes: {
            root: {
              tag: 'p',
              type: 'element',
              attrs: {},
              style: {},
              events: {
                click: {
                  trigger: 'click',
                  actions: [legacyAction],
                },
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
      rule: legacyActionRule,
      fixType: 'replace-legacy-action',
    })
    const fixedAction = (
      fixedProject.components['apiComponent']?.nodes['root'] as ElementNodeModel
    ).events['click'].actions[0]
    expect(fixedAction).toMatchInlineSnapshot(`
      {
        "arguments": [
          {
            "formula": {
              "arguments": [
                {
                  "formula": {
                    "type": "value",
                    "value": "my-id",
                  },
                  "name": "Id",
                },
              ],
              "display_name": "Get element by id",
              "name": "@toddle/getElementById",
              "type": "function",
            },
            "name": "Element",
          },
        ],
        "label": "Focus",
        "name": "@toddle/focus",
      }
    `)
  })
})
