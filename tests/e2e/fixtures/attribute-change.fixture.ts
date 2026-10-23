import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, equals, path, textNode, value } from './helpers'

export const page = 'AttributeChangePage'

export const components: Component[] = [
  {
    name: 'AttributeChangePage',
    route: {
      path: [],
      query: {},
    },
    variables: {
      input: {
        initialValue: value('initial'),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['change-attribute', 'child'],
      }),
      'change-attribute': element('button', {
        testId: 'change-attribute',
        children: ['change-attribute-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'input',
                data: value('updated'),
              },
            ],
          },
        },
      }),
      'change-attribute-text': textNode(value('Change attribute')),
      child: {
        type: 'component',
        name: 'AttributeChangeChild',
        attrs: {
          input: path('Variables', 'input'),
        },
        children: [],
        events: {},
      },
    },
  },
  {
    name: 'AttributeChangeChild',
    attributes: {
      input: {
        name: 'input',
        testValue: 'initial',
      },
    },
    variables: {
      step1: {
        initialValue: value('initial'),
      },
      step2: {
        initialValue: value('initial-derived'),
      },
      branched: {
        initialValue: value(false),
      },
    },
    onAttributeChange: {
      trigger: 'onAttributeChange',
      actions: [
        {
          type: 'SetVariable',
          variable: 'step1',
          data: path('Attributes', 'input'),
        },
        {
          type: 'SetVariable',
          variable: 'step2',
          data: path('Variables', 'step1'),
        },
        {
          type: 'Switch',
          cases: [
            {
              condition: equals(path('Variables', 'step2'), value('updated')),
              actions: [
                {
                  type: 'SetVariable',
                  variable: 'branched',
                  data: value(true),
                },
              ],
            },
          ],
          default: {
            actions: [],
          },
        },
      ],
    },
    nodes: {
      root: element('div', {
        testId: 'child-root',
        children: ['step1', 'step2', 'branched'],
      }),
      step1: element('div', {
        testId: 'step1',
        children: ['step1-text'],
      }),
      'step1-text': textNode(path('Variables', 'step1')),
      step2: element('div', {
        testId: 'step2',
        children: ['step2-text'],
      }),
      'step2-text': textNode(path('Variables', 'step2')),
      branched: element('div', {
        testId: 'branched',
        children: ['branched-text'],
      }),
      'branched-text': textNode(path('Variables', 'branched')),
    },
  },
]
