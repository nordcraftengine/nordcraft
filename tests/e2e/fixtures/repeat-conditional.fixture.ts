import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

export const page = 'RepeatConditionalPage'

export const components: Component[] = [
  {
    name: 'RepeatConditionalPage',
    route: { path: [], query: {} },
    variables: {
      activeCategory: { initialValue: value('all') },
      tasks: {
        initialValue: value([
          { id: '1', title: 'Task 1', cat: 'work' },
          { id: '2', title: 'Task 2', cat: 'personal' },
          { id: '3', title: 'Task 3', cat: 'work' },
          { id: '4', title: 'Task 4', cat: 'personal' },
        ]),
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['filter-work-btn', 'filter-all-btn', 'tasks-list'],
      }),
      'filter-work-btn': element('button', {
        testId: 'filter-work',
        children: ['work-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'activeCategory',
                data: value('work'),
              },
            ],
          },
        },
      }),
      'work-text': textNode(value('Show work')),
      'filter-all-btn': element('button', {
        testId: 'filter-all',
        children: ['all-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'activeCategory',
                data: value('all'),
              },
            ],
          },
        },
      }),
      'all-text': textNode(value('Show all')),
      'tasks-list': element('div', {
        testId: 'tasks-list',
        repeat: path('Variables', 'tasks'),
        repeatKey: path('ListItem', 'Item', 'id'),
        children: ['task-item'],
      }),
      'task-item': element('div', {
        condition: {
          type: 'or',
          arguments: [
            {
              formula: {
                type: 'function',
                name: '@toddle/equals',
                arguments: [
                  {
                    name: 'First',
                    formula: path('Variables', 'activeCategory'),
                  },
                  { name: 'Second', formula: value('all') },
                ],
              },
            },
            {
              formula: {
                type: 'function',
                name: '@toddle/equals',
                arguments: [
                  {
                    name: 'First',
                    formula: path('Variables', 'activeCategory'),
                  },
                  { name: 'Second', formula: path('ListItem', 'Item', 'cat') },
                ],
              },
            },
          ],
        },
        attrs: {
          'data-testid': {
            type: 'function',
            name: '@toddle/concatenate',
            arguments: [
              { name: '0', formula: value('task-') },
              { name: '1', formula: path('ListItem', 'Item', 'id') },
            ],
          },
        },
        children: ['task-text'],
      }),
      'task-text': textNode(path('ListItem', 'Item', 'title')),
    },
  },
]
