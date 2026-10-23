import type { Component } from '@nordcraft/core/dist/component/component.types'
import { add, componentNode, element, path, textNode, value } from './helpers'

export const page = 'EventHandlersCorePage'

export const components: Component[] = [
  {
    name: 'EventHandlersCorePage',
    route: { path: [], query: {} },
    variables: {
      count: { initialValue: value(0) },
      text: { initialValue: value('') },
      customEventPayload: { initialValue: value('none') },
      doubleClicked: { initialValue: value(false) },
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
      'count-text': textNode(path('Variables', 'count')),
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
                data: add(path('Variables', 'count'), value(1)),
              },
            ],
          },
        },
      }),
      'inc-text': textNode(value('+1')),
      'text-input': element('input', {
        testId: 'text-input',
        attrs: {
          value: path('Variables', 'text'),
        },
        events: {
          input: {
            trigger: 'input',
            actions: [
              {
                type: 'SetVariable',
                variable: 'text',
                data: path('Event', 'target', 'value'),
              },
            ],
          },
        },
      }),
      'text-display': element('div', {
        testId: 'typed-text',
        children: ['typed-text-node'],
      }),
      'typed-text-node': textNode(path('Variables', 'text')),
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
                data: value(true),
              },
            ],
          },
        },
      }),
      'dbl-text': textNode(value('Double click me')),
      'dbl-display': element('div', {
        testId: 'dbl-status',
        children: ['dbl-status-text'],
      }),
      'dbl-status-text': textNode(path('Variables', 'doubleClicked')),
      'child-comp': componentNode('CustomEventEmitterChild', {
        events: {
          notify: {
            trigger: 'notify',
            actions: [
              {
                type: 'SetVariable',
                variable: 'customEventPayload',
                data: path('Event', 'info'),
              },
            ],
          },
        },
      }),
      'custom-display': element('div', {
        testId: 'custom-event-data',
        children: ['custom-text'],
      }),
      'custom-text': textNode(path('Variables', 'customEventPayload')),
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
                      formula: value('hello from child event'),
                    },
                  ],
                },
              },
            ],
          },
        },
      }),
      'emit-text': textNode(value('Emit custom event')),
    },
  },
]
