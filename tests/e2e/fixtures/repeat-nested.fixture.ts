import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

export const page = 'RepeatNestedPage'

export const components: Component[] = [
  {
    name: 'RepeatNestedPage',
    route: { path: [], query: {} },
    variables: {
      groups: {
        initialValue: value([
          { name: 'Group A', members: ['Alice', 'Bob'] },
          { name: 'Group B', members: ['Charlie', 'Dana'] },
        ]),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['groups-container'],
      }),
      'groups-container': element('div', {
        testId: 'groups-container',
        repeat: path('Variables', 'groups'),
        children: ['group-card'],
      }),
      'group-card': element('div', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('group-') },
              { name: '1', formula: path('ListItem', 'Index') },
            ],
          },
        },
        children: ['group-title', 'members-list'],
      }),
      'group-title': element('h2', {
        children: ['group-title-text'],
      }),
      'group-title-text': textNode(path('ListItem', 'Item', 'name')),
      'members-list': element('ul', {
        repeat: path('ListItem', 'Item', 'members'),
        children: ['member-item'],
      }),
      'member-item': element('li', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('member-') },
              { name: '1', formula: path('ListItem', 'Parent', 'Index') },
              { name: '2', formula: value('-') },
              { name: '3', formula: path('ListItem', 'Index') },
            ],
          },
        },
        children: ['member-text'],
      }),
      'member-text': textNode(path('ListItem', 'Item')),
    },
  },
]
