import type { Component } from '@nordcraft/core/dist/component/component.types'
import { componentNode, element, path, textNode, value } from './helpers'

export const page = 'ContextProviderPage'

export const components: Component[] = [
  {
    name: 'ContextProviderPage',
    route: { path: [], query: {} },
    variables: {
      theme: { initialValue: value('dark') },
      counter: { initialValue: value(42) },
    },
    formulas: {
      activeTheme: {
        formula: path('Variables', 'theme'),
        exposeInContext: true,
      },
      currentCounter: {
        formula: path('Variables', 'counter'),
        exposeInContext: true,
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['set-light', 'child-consumer'],
      }),
      'set-light': element('button', {
        testId: 'set-light',
        children: ['set-light-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'theme',
                data: value('light'),
              },
            ],
          },
        },
      }),
      'set-light-text': textNode(value('Set light')),
      'child-consumer': componentNode('ContextConsumerChild'),
    },
  },
  {
    name: 'ContextConsumerChild',
    contexts: {
      ContextProviderPage: {
        formulas: ['activeTheme', 'currentCounter'],
        workflows: [],
      },
    },
    nodes: {
      root: element('div', {
        testId: 'consumer-root',
        children: ['theme-display', 'counter-display'],
      }),
      'theme-display': element('div', {
        testId: 'subscribed-theme',
        children: ['theme-text'],
      }),
      'theme-text': textNode(
        path('Contexts', 'ContextProviderPage', 'activeTheme'),
      ),
      'counter-display': element('div', {
        testId: 'subscribed-counter',
        children: ['counter-text'],
      }),
      'counter-text': textNode(
        path('Contexts', 'ContextProviderPage', 'currentCounter'),
      ),
    },
  },
]
