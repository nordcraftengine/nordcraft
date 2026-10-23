import type { Component } from '@nordcraft/core/dist/component/component.types'
import { element, path, textNode, value } from './helpers'

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
        initialValue: value(shouldFetch),
      },
      otherVar: {
        initialValue: value('initial'),
      },
      files: {
        initialValue: value(null),
      },
      combined: {
        initialValue: value(null),
      },
    },
    apis: {
      'Load files': {
        version: 2,
        name: 'Load files',
        type: 'http',
        url: value('/api/files'),
        autoFetch: path('Variables', 'shouldFetch'),
        inputs: {},
        server: {
          proxy: {
            enabled: {
              formula: value(false),
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
                data: path('Apis', 'Load files', 'data', 'items'),
              },
              {
                type: 'SetVariable',
                variable: 'combined',
                data: {
                  type: 'object',
                  arguments: [
                    {
                      name: 'files',
                      formula: path('Variables', 'files'),
                    },
                    {
                      name: 'otherVar',
                      formula: path('Variables', 'otherVar'),
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
      'heading-text': textNode(value('API state')),
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
                data: value(true),
              },
            ],
          },
        },
      }),
      'start-fetch-text': textNode(value('Start fetch')),
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
                data: value('updated-while-in-flight'),
              },
            ],
          },
        },
      }),
      'update-other-text': textNode(value('Update other variable')),
      files: element('div', {
        testId: 'files',
        children: ['files-text'],
      }),
      'files-text': textNode(path('Apis', 'Load files', 'data', 'items')),
      'combined-files': element('div', {
        testId: 'combined-files',
        children: ['combined-files-text'],
      }),
      'combined-files-text': textNode(path('Variables', 'combined', 'files')),
      'combined-other': element('div', {
        testId: 'combined-other',
        children: ['combined-other-text'],
      }),
      'combined-other-text': textNode(
        path('Variables', 'combined', 'otherVar'),
      ),
    },
  },
]
