import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

export const page = 'RepeatObjectsOrderPage'

export const components: Component[] = [
  {
    name: 'RepeatObjectsOrderPage',
    route: { path: [], query: {} },
    variables: {
      items: {
        initialValue: value([
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
                data: value([
                  { id: 'item-3', name: 'Item 3' },
                  { id: 'item-1', name: 'Item 1' },
                  { id: 'item-2', name: 'Item 2' },
                ]),
              },
            ],
          },
        },
      }),
      'move-text': textNode(value('Move 3 to front')),
      'items-list': element('div', {
        testId: 'items-container',
        repeat: path('Variables', 'items'),
        repeatKey: path('ListItem', 'Item', 'id'),
        children: ['item-card'],
      }),
      'item-card': element('div', {
        attrs: {
          'data-testid': path('ListItem', 'Item', 'id'),
        },
        children: ['card-input', 'card-text'],
      }),
      'card-input': element('input', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('input-') },
              { name: '1', formula: path('ListItem', 'Item', 'id') },
            ],
          },
        },
      }),
      'card-text': textNode(path('ListItem', 'Item', 'name')),
    },
  },
]
