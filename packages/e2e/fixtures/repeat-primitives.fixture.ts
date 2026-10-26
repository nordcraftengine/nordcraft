import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { append, element, textNode } from './helpers'

export const page = 'RepeatPrimitivesPage'

export const components: Component[] = [
  {
    name: 'RepeatPrimitivesPage',
    route: { path: [], query: {} },
    variables: {
      tags: {
        initialValue: valueFormula(['alpha', 'beta', 'gamma']),
      },
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
                data: append(
                  pathFormula(['Variables', 'tags']),
                  valueFormula('delta'),
                ),
              },
            ],
          },
        },
      }),
      'add-text': textNode(valueFormula('Add tag')),
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
                    {
                      name: 'Array',
                      formula: pathFormula(['Variables', 'tags']),
                    },
                    { name: 'Count', formula: valueFormula(1) },
                  ],
                },
              },
            ],
          },
        },
      }),
      'remove-text': textNode(valueFormula('Remove first')),
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
                    {
                      name: 'Array',
                      formula: pathFormula(['Variables', 'tags']),
                    },
                  ],
                },
              },
            ],
          },
        },
      }),
      'reverse-text': textNode(valueFormula('Reverse')),
      'tags-container': element('div', {
        testId: 'tags-list',
        repeat: pathFormula(['Variables', 'tags']),
        children: ['tag-item'],
      }),
      'tag-item': element('span', {
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: valueFormula('tag-') },
              { name: '1', formula: pathFormula(['ListItem', 'Index']) },
            ],
          },
        },
        children: ['tag-text'],
      }),
      'tag-text': textNode(pathFormula(['ListItem', 'Item'])),
    },
  },
]
