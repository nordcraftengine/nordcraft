import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, not, path, textNode, value } from './helpers'

export const page = 'ShowFormulasCorePage'

export const components: Component[] = [
  {
    name: 'ShowFormulasCorePage',
    route: { path: [], query: {} },
    variables: {
      isVisible: { initialValue: value(true) },
      role: { initialValue: value('guest') },
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
                data: not(path('Variables', 'isVisible')),
              },
            ],
          },
        },
      }),
      'toggle-text': textNode(value('Toggle visibility')),
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
                data: value('admin'),
              },
            ],
          },
        },
      }),
      'admin-text': textNode(value('Make Admin')),
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
                data: value('user'),
              },
            ],
          },
        },
      }),
      'user-text': textNode(value('Make User')),
      'simple-conditional': element('div', {
        testId: 'banner',
        condition: path('Variables', 'isVisible'),
        children: ['banner-text'],
      }),
      'banner-text': textNode(value('Welcome back!')),
      'inverted-conditional': element('div', {
        testId: 'logged-out-notice',
        condition: not(path('Variables', 'isVisible')),
        children: ['notice-text'],
      }),
      'notice-text': textNode(value('You are currently hidden.')),
      'admin-panel': element('div', {
        testId: 'admin-section',
        condition: {
          type: 'function',
          name: '@toddle/equals',
          arguments: [
            { name: 'First', formula: path('Variables', 'role') },
            { name: 'Second', formula: value('admin') },
          ],
        },
        children: ['admin-heading'],
      }),
      'admin-heading': textNode(value('Admin Dashboard')),
      'user-panel': element('div', {
        testId: 'user-section',
        condition: {
          type: 'function',
          name: '@toddle/equals',
          arguments: [
            { name: 'First', formula: path('Variables', 'role') },
            { name: 'Second', formula: value('user') },
          ],
        },
        children: ['user-heading'],
      }),
      'user-heading': textNode(value('User Profile')),
    },
  },
]
