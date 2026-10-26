import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { componentNode, element, slotNode, textNode } from './helpers'

export const page = 'SlotsCorePage'

export const components: Component[] = [
  {
    name: 'SlotsCorePage',
    route: { path: [], query: {} },
    variables: {
      dynamicSlotContent: {
        initialValue: valueFormula('initial slotted'),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['mutate-slot-btn', 'card-with-slot', 'card-empty'],
      }),
      'mutate-slot-btn': element('button', {
        testId: 'change-slot-text',
        children: ['mutate-btn-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'dynamicSlotContent',
                data: valueFormula('updated slotted text!'),
              },
            ],
          },
        },
      }),
      'mutate-btn-text': textNode(valueFormula('Update slot text')),
      'card-with-slot': componentNode('CardContainer', {
        children: ['slotted-body'],
      }),
      'slotted-body': element('p', {
        testId: 'custom-body',
        children: ['slotted-text-node'],
      }),
      'slotted-text-node': textNode(
        pathFormula(['Variables', 'dynamicSlotContent']),
      ),
      'card-empty': componentNode('CardContainer', {
        children: [],
      }),
    },
  },
  {
    name: 'CardContainer',
    nodes: {
      root: element('div', {
        testId: 'card-frame',
        children: ['body-slot'],
      }),
      'body-slot': slotNode({
        children: ['default-placeholder'],
      }),
      'default-placeholder': element('div', {
        testId: 'fallback-placeholder',
        children: ['placeholder-text'],
      }),
      'placeholder-text': textNode(valueFormula('Fallback content')),
    },
  },
]
