import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { element, textNode } from './helpers'

export const page = 'ShowFormulaSiblingPage'

export const components: Component[] = [
  {
    name: 'ShowFormulaSiblingPage',
    route: { path: [], query: {} },
    variables: {
      showMiddle: { initialValue: valueFormula(false) },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['toggle-middle', 'first-elem', 'middle-elem', 'last-elem'],
      }),
      'toggle-middle': element('button', {
        testId: 'toggle-middle',
        children: ['toggle-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'showMiddle',
                data: valueFormula(true),
              },
            ],
          },
        },
      }),
      'toggle-text': textNode(valueFormula('Show Middle')),
      'first-elem': element('div', {
        testId: 'sibling-first',
        children: ['first-text'],
      }),
      'first-text': textNode(valueFormula('First Element')),
      'middle-elem': element('div', {
        testId: 'sibling-middle',
        condition: pathFormula(['Variables', 'showMiddle']),
        children: ['middle-text'],
      }),
      'middle-text': textNode(valueFormula('Middle Element')),
      'last-elem': element('div', {
        testId: 'sibling-last',
        children: ['last-text'],
      }),
      'last-text': textNode(valueFormula('Last Element')),
    },
  },
]
