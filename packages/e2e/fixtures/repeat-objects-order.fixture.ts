import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { element, textNode } from './helpers'

export const page = 'RepeatObjectsOrderPage'

export const components: Component[] = [
  {
    name: 'RepeatObjectsOrderPage',
    route: { path: [], query: {} },
    variables: {
      items: {
        initialValue: valueFormula([
          { id: 'item-1', name: 'Item 1' },
          { id: 'item-2', name: 'Item 2' },
          { id: 'item-3', name: 'Item 3' },
        ]),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['move-btn', 'items-list'],
      }),
      'move-btn': element('button', {
        testId: 'move-to-front',
        children: ['move-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'items',
                data: valueFormula([
                  { id: 'item-3', name: 'Item 3' },
                  { id: 'item-1', name: 'Item 1' },
                  { id: 'item-2', name: 'Item 2' },
                ]),
              },
            ],
          },
        },
      }),
      'move-text': textNode(valueFormula('Move 3 to front')),
      'items-list': element('div', {
        testId: 'items-container',
        repeat: pathFormula(['Variables', 'items']),
        repeatKey: pathFormula(['ListItem', 'Item', 'id']),
        children: ['item-card'],
      }),
      'item-card': element('div', {
        attrs: {
          'data-testid': pathFormula(['ListItem', 'Item', 'id']),
        },
        children: ['card-input', 'card-text'],
      }),
      'card-input': element('input', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('input-') },
              { name: '1', formula: pathFormula(['ListItem', 'Item', 'id']) },
            ],
          },
        },
      }),
      'card-text': textNode(pathFormula(['ListItem', 'Item', 'name'])),
    },
  },
]
