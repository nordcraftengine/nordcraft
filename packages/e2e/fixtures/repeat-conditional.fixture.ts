import type { Component } from '@nordcraft/core/dist/component/component.types'
import { pathFormula } from '@nordcraft/core/dist/formula/pathFormula.helper'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { element, textNode } from './helpers'

export const page = 'RepeatConditionalPage'

export const components: Component[] = [
  {
    name: 'RepeatConditionalPage',
    route: { path: [], query: {} },
    variables: {
      activeCategory: { initialValue: valueFormula('all') },
      tasks: {
        initialValue: valueFormula([
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
                data: valueFormula('work'),
              },
            ],
          },
        },
      }),
      'work-text': textNode(valueFormula('Show work')),
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
                data: valueFormula('all'),
              },
            ],
          },
        },
      }),
      'all-text': textNode(valueFormula('Show all')),
      'tasks-list': element('div', {
        testId: 'tasks-list',
        repeat: pathFormula(['Variables', 'tasks']),
        repeatKey: pathFormula(['ListItem', 'Item', 'id']),
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
                    formula: pathFormula(['Variables', 'activeCategory']),
                  },
                  { name: 'Second', formula: valueFormula('all') },
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
                    formula: pathFormula(['Variables', 'activeCategory']),
                  },
                  {
                    name: 'Second',
                    formula: pathFormula(['ListItem', 'Item', 'cat']),
                  },
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
              { name: '0', formula: valueFormula('task-') },
              { name: '1', formula: pathFormula(['ListItem', 'Item', 'id']) },
            ],
          },
        },
        children: ['task-text'],
      }),
      'task-text': textNode(pathFormula(['ListItem', 'Item', 'title'])),
    },
  },
]
