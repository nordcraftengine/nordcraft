import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  componentNode,
  element,
  path,
  slotNode,
  textNode,
  value,
} from './helpers'

export const page = 'SlotsNestedRepeatPage'

export const components: Component[] = [
  {
    name: 'SlotsNestedRepeatPage',
    route: { path: [], query: {} },
    variables: {
      columns: { initialValue: value(['Col A', 'Col B']) },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['repeater'],
      }),
      repeater: {
        type: 'element',
        tag: 'div',
        testId: 'columns-wrapper',
        repeat: path('Variables', 'columns'),
        children: ['slotted-col'],
        events: {},
      } as any,
      'slotted-col': componentNode('ColumnWrapper', {
        children: ['col-content'],
      }),
      'col-content': element('span', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('slotted-') },
              { name: '1', formula: path('ListItem', 'Index') },
            ],
          },
        },
        children: ['col-text'],
      }),
      'col-text': textNode(path('ListItem', 'Item')),
    },
  },
  {
    name: 'ColumnWrapper',
    nodes: {
      root: element('div', {
        attrs: {
          'data-col-container': value('true'),
        },
        children: ['slot-node'],
      }),
      'slot-node': slotNode(),
    },
  },
]
