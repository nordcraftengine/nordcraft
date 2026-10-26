import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { element, textNode } from './helpers'

export const page = 'RepeatObjectEntriesPage'

export const components: Component[] = [
  {
    name: 'RepeatObjectEntriesPage',
    route: { path: [], query: {} },
    variables: {
      userProfile: {
        initialValue: valueFormula({
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
        repeat: pathFormula(['Variables', 'userProfile']),
        children: ['entry-key', 'entry-value'],
      }),
      'entry-key': element('dt', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('dt-') },
              { name: '1', formula: pathFormula(['ListItem', 'Key']) },
            ],
          },
        },
        children: ['key-text'],
      }),
      'key-text': textNode(pathFormula(['ListItem', 'Key'])),
      'entry-value': element('dd', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('dd-') },
              { name: '1', formula: pathFormula(['ListItem', 'Key']) },
            ],
          },
        },
        children: ['val-text'],
      }),
      'val-text': textNode(pathFormula(['ListItem', 'Item'])),
    },
  },
]
