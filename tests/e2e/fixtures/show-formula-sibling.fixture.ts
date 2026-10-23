import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

export const page = 'ShowFormulaSiblingPage'

export const components: Component[] = [
  {
    name: 'ShowFormulaSiblingPage',
    route: { path: [], query: {} },
    variables: {
      showMiddle: { initialValue: value(false) },
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
                data: value(true),
              },
            ],
          },
        },
      }),
      'toggle-text': textNode(value('Show Middle')),
      'first-elem': element('div', {
        testId: 'sibling-first',
        children: ['first-text'],
      }),
      'first-text': textNode(value('First Element')),
      'middle-elem': element('div', {
        testId: 'sibling-middle',
        condition: path('Variables', 'showMiddle'),
        children: ['middle-text'],
      }),
      'middle-text': textNode(value('Middle Element')),
      'last-elem': element('div', {
        testId: 'sibling-last',
        children: ['last-text'],
      }),
      'last-text': textNode(value('Last Element')),
    },
  },
]
