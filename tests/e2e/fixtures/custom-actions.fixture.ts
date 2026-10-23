import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { PluginActionV2 } from '@nordcraft/core/dist/types'
import { element, path, textNode, value } from './helpers'

export const page = 'CustomActionsPage'

export const customActions: Record<string, PluginActionV2> = {
  calculateHash: {
    version: 2,
    name: 'calculateHash',
    variableArguments: null,
    arguments: [
      {
        name: 'text',
        formula: value(''),
      },
    ],
    handler: (args: any, ctx: any) => {
      const reversed = String(args.text).split('').reverse().join('')
      ctx.triggerActionEvent('done', { result: reversed })
    },
  },
  triggerLifecycle: {
    version: 2,
    name: 'triggerLifecycle',
    variableArguments: null,
    arguments: [],
    handler: (_args: any, ctx: any) => {
      ctx.triggerActionEvent('fired', { timestamp: 12345 })
    },
  },
}

export const components: Component[] = [
  {
    name: 'CustomActionsPage',
    route: { path: [], query: {} },
    customCode: true,
    variables: {
      inputStr: { initialValue: value('nordcraft') },
      outputStr: { initialValue: value('none') },
      lifecycleRan: { initialValue: value(false) },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: [
          'input-elem',
          'run-hash-btn',
          'hash-output',
          'run-lifecycle-btn',
          'lifecycle-output',
        ],
      }),
      'input-elem': element('input', {
        testId: 'hash-input',
        attrs: {
          value: path('Variables', 'inputStr'),
        },
        events: {
          input: {
            trigger: 'input',
            actions: [
              {
                type: 'SetVariable',
                variable: 'inputStr',
                data: path('Event', 'target', 'value'),
              },
            ],
          },
        },
      }),
      'run-hash-btn': element('button', {
        testId: 'run-hash',
        children: ['run-hash-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                version: 2,
                name: 'calculateHash',
                arguments: [
                  {
                    name: 'text',
                    formula: path('Variables', 'inputStr'),
                  },
                ],
                events: {
                  done: {
                    actions: [
                      {
                        type: 'SetVariable',
                        variable: 'outputStr',
                        data: path('Event', 'result'),
                      },
                    ],
                  },
                },
              } as any,
            ],
          },
        },
      }),
      'run-hash-text': textNode(value('Run Hash')),
      'hash-output': element('div', {
        testId: 'hash-result',
        children: ['hash-output-text'],
      }),
      'hash-output-text': textNode(path('Variables', 'outputStr')),
      'run-lifecycle-btn': element('button', {
        testId: 'run-lifecycle',
        children: ['run-lifecycle-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                version: 2,
                name: 'triggerLifecycle',
                arguments: [],
                events: {
                  fired: {
                    actions: [
                      {
                        type: 'SetVariable',
                        variable: 'lifecycleRan',
                        data: value(true),
                      },
                    ],
                  },
                },
              } as any,
            ],
          },
        },
      }),
      'run-lifecycle-text': textNode(value('Run Lifecycle')),
      'lifecycle-output': element('div', {
        testId: 'lifecycle-status',
        children: ['lifecycle-output-text'],
      }),
      'lifecycle-output-text': textNode(path('Variables', 'lifecycleRan')),
    },
  },
]
