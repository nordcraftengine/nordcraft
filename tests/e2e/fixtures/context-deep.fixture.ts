import type { Component } from '@nordcraft/core/dist/component/component.types'
import { componentNode, element, path, textNode, value } from './helpers'

export const page = 'DeepContextProviderPage'

export const components: Component[] = [
  {
    name: 'DeepContextProviderPage',
    route: { path: [], query: {} },
    variables: {
      brand: { initialValue: value('Nordcraft') },
    },
    formulas: {
      brandName: {
        formula: path('Variables', 'brand'),
        exposeInContext: true,
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: ['mutate-btn', 'intermediate'],
      }),
      'mutate-btn': element('button', {
        testId: 'mutate-brand',
        children: ['mutate-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'brand',
                data: value('Nordcraft Engine'),
              },
            ],
          },
        },
      }),
      'mutate-text': textNode(value('Mutate')),
      intermediate: componentNode('IntermediateComponent'),
    },
  },
  {
    name: 'IntermediateComponent',
    nodes: {
      root: element('div', {
        testId: 'intermediate-root',
        children: ['deep-consumer'],
      }),
      'deep-consumer': componentNode('DeepConsumerComponent'),
    },
  },
  {
    name: 'DeepConsumerComponent',
    contexts: {
      DeepContextProviderPage: {
        formulas: ['brandName'],
        workflows: [],
      },
    },
    nodes: {
      root: element('div', {
        testId: 'deep-root',
        children: ['brand-display'],
      }),
      'brand-display': element('span', {
        testId: 'deep-brand-name',
        children: ['brand-text'],
      }),
      'brand-text': textNode(
        path('Contexts', 'DeepContextProviderPage', 'brandName'),
      ),
    },
  },
]
