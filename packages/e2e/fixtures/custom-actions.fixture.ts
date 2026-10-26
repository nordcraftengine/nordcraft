import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import type { PluginActionV2 } from '@nordcraft/core/dist/types'
import { element, textNode } from './helpers'

export const page = 'CustomActionsPage'

export const customActions: Record<string, PluginActionV2> = {
  calculateHash: {
    version: 2,
    name: 'calculateHash',
    variableArguments: null,
    arguments: [
      {
        name: 'text',
        formula: valueFormula(''),
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
      inputStr: { initialValue: valueFormula('nordcraft') },
      outputStr: { initialValue: valueFormula('none') },
      lifecycleRan: { initialValue: valueFormula(false) },
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
          value: pathFormula(['Variables', 'inputStr']),
        },
        events: {
          input: {
            trigger: 'input',
            actions: [
              {
                type: 'SetVariable',
                variable: 'inputStr',
                data: pathFormula(['Event', 'target', 'value']),
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
                    formula: pathFormula(['Variables', 'inputStr']),
                  },
                ],
                events: {
                  done: {
                    actions: [
                      {
                        type: 'SetVariable',
                        variable: 'outputStr',
                        data: pathFormula(['Event', 'result']),
                      },
                    ],
                  },
                },
              } as any,
            ],
          },
        },
      }),
      'run-hash-text': textNode(valueFormula('Run Hash')),
      'hash-output': element('div', {
        testId: 'hash-result',
        children: ['hash-output-text'],
      }),
      'hash-output-text': textNode(pathFormula(['Variables', 'outputStr'])),
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
                        data: valueFormula(true),
                      },
                    ],
                  },
                },
              } as any,
            ],
          },
        },
      }),
      'run-lifecycle-text': textNode(valueFormula('Run Lifecycle')),
      'lifecycle-output': element('div', {
        testId: 'lifecycle-status',
        children: ['lifecycle-output-text'],
      }),
      'lifecycle-output-text': textNode(
        pathFormula(['Variables', 'lifecycleRan']),
      ),
    },
  },
]
