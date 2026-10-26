import type { Component } from '@nordcraft/core/dist/component/component.types'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { element, textNode } from './helpers'

export const createApiStateComponents = ({
  shouldFetch,
}: {
  shouldFetch: boolean
}): Component[] => [
  {
    name: 'ApiStatePage',
    route: {
      path: [],
      query: {},
    },
    variables: {
      shouldFetch: {
        initialValue: valueFormula(shouldFetch),
      },
      otherVar: {
        initialValue: valueFormula('initial'),
      },
      files: {
        initialValue: valueFormula(null),
      },
      combined: {
        initialValue: valueFormula(null),
      },
    },
    apis: {
      'Load files': {
        version: 2,
        name: 'Load files',
        type: 'http',
        url: valueFormula('/api/files'),
        autoFetch: pathFormula(['Variables', 'shouldFetch']),
        inputs: {},
        server: {
          proxy: {
            enabled: {
              formula: valueFormula(false),
            },
          },
        },
        client: {
          parserMode: 'json',
          onCompleted: {
            trigger: 'success',
            actions: [
              {
                type: 'SetVariable',
                variable: 'files',
                data: pathFormula(['Apis', 'Load files', 'data', 'items']),
              },
              {
                type: 'SetVariable',
                variable: 'combined',
                data: {
                  type: 'object',
                  arguments: [
                    {
                      name: 'files',
                      formula: pathFormula(['Variables', 'files']),
                    },
                    {
                      name: 'otherVar',
                      formula: pathFormula(['Variables', 'otherVar']),
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    nodes: {
      root: element('div', {
        testId: 'root',
        children: [
          'heading',
          'start-fetch',
          'update-other',
          'files',
          'combined-files',
          'combined-other',
        ],
      }),
      heading: element('h1', {
        children: ['heading-text'],
      }),
      'heading-text': textNode(valueFormula('API state')),
      'start-fetch': element('button', {
        testId: 'start-fetch',
        children: ['start-fetch-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'shouldFetch',
                data: valueFormula(true),
              },
            ],
          },
        },
      }),
      'start-fetch-text': textNode(valueFormula('Start fetch')),
      'update-other': element('button', {
        testId: 'update-other',
        children: ['update-other-text'],
        events: {
          click: {
            trigger: 'click',
            actions: [
              {
                type: 'SetVariable',
                variable: 'otherVar',
                data: valueFormula('updated-while-in-flight'),
              },
            ],
          },
        },
      }),
      'update-other-text': textNode(valueFormula('Update other variable')),
      files: element('div', {
        testId: 'files',
        children: ['files-text'],
      }),
      'files-text': textNode(
        pathFormula(['Apis', 'Load files', 'data', 'items']),
      ),
      'combined-files': element('div', {
        testId: 'combined-files',
        children: ['combined-files-text'],
      }),
      'combined-files-text': textNode(
        pathFormula(['Variables', 'combined', 'files']),
      ),
      'combined-other': element('div', {
        testId: 'combined-other',
        children: ['combined-other-text'],
      }),
      'combined-other-text': textNode(
        pathFormula(['Variables', 'combined', 'otherVar']),
      ),
    },
  },
]
