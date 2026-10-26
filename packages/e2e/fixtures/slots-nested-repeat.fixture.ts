import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { componentNode, element, slotNode, textNode } from './helpers'

export const page = 'SlotsNestedRepeatPage'

export const components: Component[] = [
  {
    name: 'SlotsNestedRepeatPage',
    route: { path: [], query: {} },
    variables: {
      columns: { initialValue: valueFormula(['Col A', 'Col B']) },
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
        repeat: pathFormula(['Variables', 'columns']),
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
              { name: '0', formula: valueFormula('slotted-') },
              { name: '1', formula: pathFormula(['ListItem', 'Index']) },
            ],
          },
        },
        children: ['col-text'],
      }),
      'col-text': textNode(pathFormula(['ListItem', 'Item'])),
    },
  },
  {
    name: 'ColumnWrapper',
    nodes: {
      root: element('div', {
        attrs: {
          'data-col-container': valueFormula('true'),
        },
        children: ['slot-node'],
      }),
      'slot-node': slotNode(),
    },
  },
]
