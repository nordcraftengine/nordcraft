import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { componentNode, element, textNode } from './helpers'

export const page = 'ContextProviderPage'

export const components: Component[] = [
  {
    name: 'ContextProviderPage',
    route: { path: [], query: {} },
    variables: {
      theme: { initialValue: valueFormula('dark') },
      counter: { initialValue: valueFormula(42) },
    },
    formulas: {
      activeTheme: {
        formula: pathFormula(['Variables', 'theme']),
        exposeInContext: true,
      },
      currentCounter: {
        formula: pathFormula(['Variables', 'counter']),
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
                data: valueFormula('light'),
              },
            ],
          },
        },
      }),
      'set-light-text': textNode(valueFormula('Set light')),
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
        pathFormula(['Contexts', 'ContextProviderPage', 'activeTheme']),
      ),
      'counter-display': element('div', {
        testId: 'subscribed-counter',
        children: ['counter-text'],
      }),
      'counter-text': textNode(
        pathFormula(['Contexts', 'ContextProviderPage', 'currentCounter']),
      ),
    },
  },
]
