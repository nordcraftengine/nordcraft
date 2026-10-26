import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { componentNode, element, textNode } from './helpers'

export const page = 'ContextWorkflowPage'

export const components: Component[] = [
  {
    name: 'ContextWorkflowPage',
    route: { path: [], query: {} },
    variables: {
      message: { initialValue: valueFormula('initial') },
    },
    workflows: {
      updateMessage: {
        name: 'updateMessage',
        parameters: [{ name: 'newMessage', testValue: 'test' }],
        actions: [
          {
            type: 'SetVariable',
            variable: 'message',
            data: pathFormula(['Parameters', 'newMessage']),
          },
        ],
      },
    },
    formulas: {
      currentMessage: {
        formula: pathFormula(['Variables', 'message']),
        exposeInContext: true,
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['message-display', 'child-invoker'],
      }),
      'message-display': element('div', {
        testId: 'provider-message',
        children: ['message-text'],
      }),
      'message-text': textNode(pathFormula(['Variables', 'message'])),
      'child-invoker': componentNode('ContextWorkflowChild'),
    },
  },
  {
    name: 'ContextWorkflowChild',
    contexts: {
      ContextWorkflowPage: {
        formulas: ['currentMessage'],
        workflows: ['updateMessage'],
      },
    },
    nodes: {
      root: element('div', {
        testId: 'child-root',
        children: ['trigger-btn'],
      }),
      'trigger-btn': element('button', {
        testId: 'trigger-context-wf',
        children: ['trigger-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'TriggerWorkflow',
                contextProvider: 'ContextWorkflowPage',
                workflow: 'updateMessage',
                parameters: {
                  newMessage: {
                    formula: valueFormula('updated via context workflow'),
                  },
                },
              },
            ],
          },
        },
      }),
      'trigger-text': textNode(valueFormula('Trigger WF')),
    },
  },
]
