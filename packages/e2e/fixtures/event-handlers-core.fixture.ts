import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { add, componentNode, element, textNode } from './helpers'

export const page = 'EventHandlersCorePage'

export const components: Component[] = [
  {
    name: 'EventHandlersCorePage',
    route: { path: [], query: {} },
    variables: {
      count: { initialValue: valueFormula(0) },
      text: { initialValue: valueFormula('') },
      customEventPayload: { initialValue: valueFormula('none') },
      doubleClicked: { initialValue: valueFormula(false) },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: [
          'count-display',
          'inc-btn',
          'text-input',
          'text-display',
          'dbl-btn',
          'dbl-display',
          'child-comp',
          'custom-display',
        ],
      }),
      'count-display': element('div', {
        testId: 'count-value',
        children: ['count-text'],
      }),
      'count-text': textNode(pathFormula(['Variables', 'count'])),
      'inc-btn': element('button', {
        testId: 'inc-button',
        children: ['inc-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'count',
                data: add(pathFormula(['Variables', 'count']), valueFormula(1)),
              },
            ],
          },
        },
      }),
      'inc-text': textNode(valueFormula('+1')),
      'text-input': element('input', {
        testId: 'text-input',
        attrs: {
          value: pathFormula(['Variables', 'text']),
        },
        events: {
          input: {
            trigger: 'input',
            actions: [
              {
                type: 'SetVariable',
                variable: 'text',
                data: pathFormula(['Event', 'target', 'value']),
              },
            ],
          },
        },
      }),
      'text-display': element('div', {
        testId: 'typed-text',
        children: ['typed-text-node'],
      }),
      'typed-text-node': textNode(pathFormula(['Variables', 'text'])),
      'dbl-btn': element('button', {
        testId: 'dbl-button',
        children: ['dbl-text'],
        events: {
          dblclick: {
            trigger: 'dblclick',
            actions: [
              {
                type: 'SetVariable',
                variable: 'doubleClicked',
                data: valueFormula(true),
              },
            ],
          },
        },
      }),
      'dbl-text': textNode(valueFormula('Double click me')),
      'dbl-display': element('div', {
        testId: 'dbl-status',
        children: ['dbl-status-text'],
      }),
      'dbl-status-text': textNode(pathFormula(['Variables', 'doubleClicked'])),
      'child-comp': componentNode('CustomEventEmitterChild', {
        events: {
          notify: {
            trigger: 'notify',
            actions: [
              {
                type: 'SetVariable',
                variable: 'customEventPayload',
                data: pathFormula(['Event', 'info']),
              },
            ],
          },
        },
      }),
      'custom-display': element('div', {
        testId: 'custom-event-data',
        children: ['custom-text'],
      }),
      'custom-text': textNode(pathFormula(['Variables', 'customEventPayload'])),
    },
  },
  {
    name: 'CustomEventEmitterChild',
    events: [{ name: 'notify', dummyEvent: null }],
    nodes: {
      root: element('div', {
        testId: 'emitter-root',
        children: ['emit-btn'],
      }),
      'emit-btn': element('button', {
        testId: 'emit-event-btn',
        children: ['emit-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'TriggerEvent',
                event: 'notify',
                data: {
                  type: 'object',
                  arguments: [
                    {
                      name: 'info',
                      formula: valueFormula('hello from child event'),
                    },
                  ],
                },
              },
            ],
          },
        },
      }),
      'emit-text': textNode(valueFormula('Emit custom event')),
    },
  },
]
