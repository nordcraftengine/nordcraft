import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

export const page = 'RepeatObjectEntriesPage'

export const components: Component[] = [
  {
    name: 'RepeatObjectEntriesPage',
    route: { path: [], query: {} },
    variables: {
      userProfile: {
        initialValue: value({
          role: 'Admin',
          status: 'Active',
          country: 'Denmark',
        }),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['entries-container'],
      }),
      'entries-container': element('dl', {
        testId: 'profile-entries',
        repeat: path('Variables', 'userProfile'),
        children: ['entry-key', 'entry-value'],
      }),
      'entry-key': element('dt', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('dt-') },
              { name: '1', formula: path('ListItem', 'Key') },
            ],
          },
        },
        children: ['key-text'],
      }),
      'key-text': textNode(path('ListItem', 'Key')),
      'entry-value': element('dd', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('dd-') },
              { name: '1', formula: path('ListItem', 'Key') },
            ],
          },
        },
        children: ['val-text'],
      }),
      'val-text': textNode(path('ListItem', 'Item')),
    },
  },
]
