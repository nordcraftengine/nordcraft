import type { Component } from '@nordcraft/core/dist/component/component.types'
import { append, element, path, textNode, value } from './helpers'

export const page = 'RepeatPrimitivesPage'

export const components: Component[] = [
  {
    name: 'RepeatPrimitivesPage',
    route: { path: [], query: {} },
    variables: {
      tags: { initialValue: value(['alpha', 'beta', 'gamma']) },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['add-btn', 'remove-btn', 'reverse-btn', 'tags-container'],
      }),
      'add-btn': element('button', {
        testId: 'add-tag',
        children: ['add-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'tags',
                data: append(path('Variables', 'tags'), value('delta')),
              },
            ],
          },
        },
      }),
      'add-text': textNode(value('Add tag')),
      'remove-btn': element('button', {
        testId: 'remove-first',
        children: ['remove-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'tags',
                data: {
                  type: 'function',
                  name: '@toddle/drop',
                  arguments: [
                    { name: 'Array', formula: path('Variables', 'tags') },
                    { name: 'Count', formula: value(1) },
                  ],
                },
              },
            ],
          },
        },
      }),
      'remove-text': textNode(value('Remove first')),
      'reverse-btn': element('button', {
        testId: 'reverse-tags',
        children: ['reverse-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'tags',
                data: {
                  type: 'function',
                  name: '@toddle/reverse',
                  arguments: [
                    { name: 'Array', formula: path('Variables', 'tags') },
                  ],
                },
              },
            ],
          },
        },
      }),
      'reverse-text': textNode(value('Reverse')),
      'tags-container': element('div', {
        testId: 'tags-list',
        repeat: path('Variables', 'tags'),
        children: ['tag-item'],
      }),
      'tag-item': element('span', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('tag-') },
              { name: '1', formula: path('ListItem', 'Index') },
            ],
          },
        },
        children: ['tag-text'],
      }),
      'tag-text': textNode(path('ListItem', 'Item')),
    },
  },
]
