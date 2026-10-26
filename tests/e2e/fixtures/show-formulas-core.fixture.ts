import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { element, not, textNode } from './helpers'

export const page = 'ShowFormulasCorePage'

export const components: Component[] = [
  {
    name: 'ShowFormulasCorePage',
    route: { path: [], query: {} },
    variables: {
      isVisible: { initialValue: valueFormula(true) },
      role: { initialValue: valueFormula('guest') },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: [
          'toggle-vis-btn',
          'set-admin-btn',
          'set-user-btn',
          'simple-conditional',
          'inverted-conditional',
          'admin-panel',
          'user-panel',
        ],
      }),
      'toggle-vis-btn': element('button', {
        testId: 'toggle-vis',
        children: ['toggle-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'isVisible',
                data: not(pathFormula(['Variables', 'isVisible'])),
              },
            ],
          },
        },
      }),
      'toggle-text': textNode(valueFormula('Toggle visibility')),
      'set-admin-btn': element('button', {
        testId: 'set-admin',
        children: ['admin-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'role',
                data: valueFormula('admin'),
              },
            ],
          },
        },
      }),
      'admin-text': textNode(valueFormula('Make Admin')),
      'set-user-btn': element('button', {
        testId: 'set-user',
        children: ['user-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'role',
                data: valueFormula('user'),
              },
            ],
          },
        },
      }),
      'user-text': textNode(valueFormula('Make User')),
      'simple-conditional': element('div', {
        testId: 'banner',
        condition: pathFormula(['Variables', 'isVisible']),
        children: ['banner-text'],
      }),
      'banner-text': textNode(valueFormula('Welcome back!')),
      'inverted-conditional': element('div', {
        testId: 'logged-out-notice',
        condition: not(pathFormula(['Variables', 'isVisible'])),
        children: ['notice-text'],
      }),
      'notice-text': textNode(valueFormula('You are currently hidden.')),
      'admin-panel': element('div', {
        testId: 'admin-section',
        condition: {
          type: 'function',
          name: '@toddle/equals',
          arguments: [
            { name: 'First', formula: pathFormula(['Variables', 'role']) },
            { name: 'Second', formula: valueFormula('admin') },
          ],
        },
        children: ['admin-heading'],
      }),
      'admin-heading': textNode(valueFormula('Admin Dashboard')),
      'user-panel': element('div', {
        testId: 'user-section',
        condition: {
          type: 'function',
          name: '@toddle/equals',
          arguments: [
            { name: 'First', formula: pathFormula(['Variables', 'role']) },
            { name: 'Second', formula: valueFormula('user') },
          ],
        },
        children: ['user-heading'],
      }),
      'user-heading': textNode(valueFormula('User Profile')),
    },
  },
]
