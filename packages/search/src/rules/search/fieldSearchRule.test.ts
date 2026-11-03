import type { ProjectFiles } from '@nordcraft/ssr'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../searchProject'
import type { SearchResult } from '../../types'
import { createFieldSearchRule } from './fieldSearchRule'

describe('fieldSearchRule & structured search', () => {
  const files: ProjectFiles = {
    formulas: {
      globalFormat: {
        name: 'formatDate',
        arguments: [{ name: 'dateInput', testValue: '2026-01-01' }],
        formula: {
          type: 'path',
          path: ['Args', 'dateInput'],
        },
      },
    },
    actions: {
      trackAction: {
        name: 'TrackEvent',
        version: 2,
        variableArguments: false,
        arguments: [],
        handler: '() => {}',
      },
    },
    services: {
      supaService: {
        name: 'Supabase',
        type: 'supabase',
      },
    },
    themes: {
      Default: {
        fonts: [],
        propertyDefinitions: {
          '--primary-color': {
            syntax: { type: 'primitive', name: '*' },
            description: '',
            inherits: true,
            initialValue: '#0055ff',
            values: {},
          },
          '--button-bg': {
            syntax: { type: 'primitive', name: '*' },
            description: '',
            inherits: true,
            initialValue: 'var(--primary-color)',
            values: {},
          },
        },
      },
    },
    packages: {
      ui: {
        manifest: {
          name: 'ui',
          commit: '123',
        },
        components: {
          PkgBadge: {
            name: 'PkgBadge',
            exported: true,
            nodes: {},
            formulas: {
              pkgCtxFormula: {
                name: 'badgeCount',
                exposeInContext: true,
                formula: { type: 'value', value: 5 },
              },
            },
            workflows: {
              pkgCtxWf: {
                name: 'Reset badge',
                exposeInContext: true,
                parameters: [],
                actions: [],
              },
            },
            apis: {},
            attributes: {
              tone: { name: 'tone', testValue: 'info' },
            },
            variables: {},
          },
        },
        formulas: {
          pkgFormat: {
            name: 'pkgFormat',
            exported: true,
            arguments: [],
            formula: { type: 'value', value: 'ok' },
          },
        },
        actions: {
          pkgLog: {
            name: 'pkgLog',
            version: 2,
            variableArguments: false,
            arguments: [],
            exported: true,
            handler: '() => {}',
          },
        },
      },
    },
    components: {
      Broadcaster: {
        name: 'Broadcaster',
        nodes: {
          slotNode: {
            type: 'slot',
            name: 'header',
            children: [],
          },
        },
        formulas: {
          bFormulaKey: {
            name: 'activeChannel',
            exposeInContext: true,
            arguments: [{ name: 'prefix', testValue: 'ch' }],
            formula: {
              type: 'path',
              path: ['Args', 'prefix'],
            },
          },
          internalCaller: {
            name: 'internalCaller',
            formula: {
              type: 'apply',
              name: 'bFormulaKey',
              arguments: [
                {
                  name: 'prefix',
                  formula: { type: 'value', value: 'main' },
                },
              ],
            },
          },
        },
        workflows: {
          wfEmit: {
            name: 'Emit event',
            exposeInContext: true,
            parameters: [{ name: 'payload', testValue: null }],
            actions: [
              {
                type: 'TriggerEvent',
                event: 'broadcasted',
                data: {
                  type: 'path',
                  path: ['Parameters', 'payload'],
                },
              },
            ],
          },
          wfInternal: {
            name: 'Internal runner',
            parameters: [],
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'wfEmit',
                parameters: {
                  payload: {
                    formula: { type: 'value', value: 'hello' },
                  },
                },
              },
            ],
          },
        },
        apis: {},
        attributes: {
          channelId: { name: 'channelId', testValue: '1' },
        },
        variables: {},
        events: [{ name: 'broadcasted', dummyEvent: null }],
      },
      'Broadcaster old': {
        name: 'Broadcaster old',
        nodes: {},
        formulas: {},
        workflows: {
          wfEmit: {
            name: 'Emit event',
            exposeInContext: true,
            parameters: [],
            actions: [],
          },
        },
        apis: {},
        attributes: {},
        variables: {},
      },
      ConsumerPage: {
        name: 'ConsumerPage',
        route: {
          path: [{ type: 'param', name: 'tab', testValue: 'home' }],
          query: {
            search: { name: 'search', testValue: '' },
          },
        },
        contexts: {
          Broadcaster: {
            componentName: 'Broadcaster',
            formulas: ['bFormulaKey'],
            workflows: ['wfEmit'],
          },
          'Broadcaster old': {
            componentName: 'Broadcaster old',
            formulas: [],
            workflows: ['wfEmit'],
          },
          'ui/PkgBadge': {
            package: 'ui',
            componentName: 'PkgBadge',
            formulas: ['pkgCtxFormula'],
            workflows: ['pkgCtxWf'],
          },
        },
        attributes: {},
        variables: {
          isOpen: {
            initialValue: { type: 'value', value: false },
          },
        },
        apis: {
          usersApi: {
            name: 'usersApi',
            version: 2,
            type: 'http',
            service: 'Supabase',
            autoFetch: { type: 'value', value: true },
            inputs: {
              limit: {
                formula: { type: 'value', value: 10 },
              },
            },
            url: {
              type: 'path',
              path: ['Args', 'limit'],
            },
          },
        },
        formulas: {
          readCtx: {
            name: 'readCtx',
            formula: {
              type: 'path',
              path: ['Contexts', 'Broadcaster', 'bFormulaKey'],
            },
          },
          readPkgCtx: {
            name: 'readPkgCtx',
            formula: {
              type: 'path',
              path: ['Contexts', 'ui/PkgBadge', 'pkgCtxFormula'],
            },
          },
          callGlobalFormula: {
            name: 'callGlobalFormula',
            formula: {
              type: 'function',
              name: 'globalFormat',
              arguments: [
                {
                  name: 'dateInput',
                  formula: {
                    type: 'path',
                    path: ['Variables', 'isOpen'],
                  },
                },
              ],
            },
          },
          callPkgFormula: {
            name: 'callPkgFormula',
            formula: {
              type: 'function',
              package: 'ui',
              name: 'pkgFormat',
              arguments: [],
            },
          },
          readApiAndUrl: {
            name: 'readApiAndUrl',
            formula: {
              type: 'and',
              arguments: [
                {
                  formula: {
                    type: 'path',
                    path: ['Apis', 'usersApi', 'data'],
                  },
                },
                {
                  formula: {
                    type: 'path',
                    path: ['URL parameters', 'tab'],
                  },
                },
              ],
            },
          },
        },
        workflows: {
          onAction: {
            name: 'onAction',
            parameters: [],
            actions: [
              {
                type: 'TriggerWorkflow',
                contextProvider: 'Broadcaster',
                workflow: 'wfEmit',
                parameters: {
                  payload: {
                    formula: { type: 'value', value: 'from-consumer' },
                  },
                },
              },
              {
                type: 'TriggerWorkflow',
                contextProvider: 'Broadcaster old',
                workflow: 'wfEmit',
              },
              {
                type: 'TriggerWorkflow',
                contextProvider: 'ui/PkgBadge',
                workflow: 'pkgCtxWf',
              },
              {
                type: 'Custom',
                name: 'TrackEvent',
              },
              {
                type: 'Custom',
                package: 'ui',
                name: 'pkgLog',
              },
              {
                type: 'SetVariable',
                variable: 'isOpen',
                data: { type: 'value', value: true },
              },
              {
                type: 'Fetch',
                api: 'usersApi',
                inputs: {
                  limit: { formula: { type: 'value', value: 25 } },
                },
              },
              {
                type: 'SetURLParameter',
                parameter: 'tab',
                data: { type: 'value', value: 'settings' },
              },
            ],
          },
        },
        nodes: {
          rootDiv: {
            type: 'element',
            tag: 'div',
            attrs: {
              id: { type: 'value', value: 'hero' },
            },
            classes: {
              card: {},
              primary: {},
            },
            style: {
              display: 'flex',
              color: 'var(--primary-color)',
              animation: 'fadeIn 200ms ease',
            },
            animations: {
              fadeIn: {},
            },
            events: {
              click: {
                trigger: 'click',
                actions: [],
              },
            },
            children: [
              'imgWithAlt',
              'imgNoAlt',
              'broadcasterInstance',
              'pkgInstance',
              'submitBtn',
            ],
          },
          imgWithAlt: {
            type: 'element',
            tag: 'img',
            attrs: {
              alt: { type: 'value', value: 'Company logo' },
              src: { type: 'value', value: '/assets/logo.png' },
            },
            children: [],
            events: {},
          },
          imgNoAlt: {
            type: 'element',
            tag: 'img',
            attrs: {
              src: { type: 'value', value: '/assets/banner.jpg' },
            },
            children: [],
            events: {},
          },
          broadcasterInstance: {
            type: 'component',
            name: 'Broadcaster',
            attrs: {
              channelId: { type: 'value', value: 'news' },
            },
            events: {
              broadcasted: {
                trigger: 'broadcasted',
                actions: [],
              },
            },
            children: ['slottedChild'],
          },
          slottedChild: {
            type: 'element',
            tag: 'span',
            slot: 'header',
            attrs: {},
            children: [],
            events: {},
          },
          pkgInstance: {
            type: 'component',
            package: 'ui',
            name: 'PkgBadge',
            attrs: {
              tone: { type: 'value', value: 'warning' },
            },
            events: {},
            children: [],
          },
          submitBtn: {
            type: 'element',
            tag: 'button',
            classes: {
              cta: {},
            },
            attrs: {},
            children: ['submitText'],
            events: {},
          },
          submitText: {
            type: 'text',
            value: { type: 'value', value: 'Submit order' },
          },
        },
      },
    },
  }

  test('it finds element nodes by tag, id, and classes (<div#hero.card.primary>)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '<div#hero.card.primary>' })],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'nodes', 'rootDiv'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds element nodes with attribute operators and negation (<img> -<[alt]>)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '<img> -<[alt]>' })],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'nodes', 'imgNoAlt'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds element nodes by attribute prefix, suffix, and substring (<img[src^="/assets"][src$=".png"][alt*="logo"]>)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<img[src^="/assets"][src$=".png"][alt*="logo"]>',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'nodes', 'imgWithAlt'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds nodes by style and event selectors (<[style:display=flex][event:click]>)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<[style:display=flex][event:click]>',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'nodes', 'rootDiv'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds component nodes combined with child text (<button.cta> "Submit order")', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '<button.cta> "Submit order"',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'nodes', 'submitBtn'],
        details: {
          context: {
            before: '',
            matched: 'Submit order',
            after: '',
          },
          field: 'children',
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds all references to a specific component workflow without clashing with another component (@workflow:"Broadcaster"/"Emit event")', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@workflow:"Broadcaster"/"Emit event"',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'Broadcaster',
          'workflows',
          'wfInternal',
          'actions',
          '0',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'action-model',
        },
      },
      {
        path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-context',
        },
      },
      {
        path: [
          'components',
          'ConsumerPage',
          'workflows',
          'onAction',
          'actions',
          '0',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'action-model',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds only external context references when using @context:"Broadcaster"/"Emit event"', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@context:"Broadcaster"/"Emit event"',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-context',
        },
      },
      {
        path: [
          'components',
          'ConsumerPage',
          'workflows',
          'onAction',
          'actions',
          '0',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'action-model',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds all references to a component formula by display name (@formula:Broadcaster/activeChannel)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@formula:Broadcaster/activeChannel',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'Broadcaster',
          'formulas',
          'internalCaller',
          'formula',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'formula',
        },
      },
      {
        path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-context',
        },
      },
      {
        path: ['components', 'ConsumerPage', 'formulas', 'readCtx', 'formula'],
        details: {
          context: null,
          field: null,
          nodeType: 'formula',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds references to a project formula (@formula:/formatDate)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@formula:/formatDate',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'ConsumerPage',
          'formulas',
          'callGlobalFormula',
          'formula',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'formula',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it supports prefix, exact quoted, and wildcard reference matching (@component:Broadcaster vs @component:"Broadcaster" vs @component:*badge* and @event:*)', () => {
    const prefixComponentResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@component:Broadcaster' })],
      }),
    )
    const exactComponentResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@component:"Broadcaster"' })],
      }),
    )
    const wildcardComponentResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@component:*badge*' })],
      }),
    )
    const allEventsResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@event:*' })],
      }),
    )

    expect({
      prefixComponentResults,
      exactComponentResults,
      wildcardComponentResults,
      allEventsResults,
    }).toEqual({
      prefixComponentResults: [
        {
          path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-context',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster old'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-context',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'broadcasterInstance'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
      ],
      exactComponentResults: [
        {
          path: ['components', 'ConsumerPage', 'contexts', 'Broadcaster'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-context',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'broadcasterInstance'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
      ],
      wildcardComponentResults: [
        {
          path: ['components', 'ConsumerPage', 'contexts', 'ui/PkgBadge'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-context',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'pkgInstance'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
      ],
      allEventsResults: [
        {
          path: [
            'components',
            'Broadcaster',
            'workflows',
            'wfEmit',
            'actions',
            '0',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'rootDiv'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'broadcasterInstance'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
      ],
    })
  })

  test('it finds references to a variable (@var:ConsumerPage/isOpen)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@var:ConsumerPage/isOpen',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'ConsumerPage',
          'formulas',
          'callGlobalFormula',
          'formula',
          'arguments',
          0,
          'formula',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'formula',
        },
      },
      {
        path: [
          'components',
          'ConsumerPage',
          'workflows',
          'onAction',
          'actions',
          '5',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'action-model',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds references to a component attribute (@attr:Broadcaster/channelId)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@attr:Broadcaster/channelId',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'ConsumerPage',
          'nodes',
          'broadcasterInstance',
          'attrs',
          'channelId',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node-attribute',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds references to a component event (@event:Broadcaster/broadcasted)', () => {
    const results = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@event:Broadcaster/broadcasted',
          }),
        ],
      }),
    )

    expect(results).toEqual([
      {
        path: [
          'components',
          'Broadcaster',
          'workflows',
          'wfEmit',
          'actions',
          '0',
        ],
        details: {
          context: null,
          field: null,
          nodeType: 'action-model',
        },
      },
      {
        path: ['components', 'ConsumerPage', 'nodes', 'broadcasterInstance'],
        details: {
          context: null,
          field: null,
          nodeType: 'component-node',
        },
      },
    ] satisfies SearchResult[])
  })

  test('it finds references to a component API and API input (@api:ConsumerPage/usersApi and @api-input:ConsumerPage/usersApi/limit)', () => {
    const apiResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@api:ConsumerPage/usersApi',
          }),
        ],
      }),
    )
    const inputResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@api-input:ConsumerPage/usersApi/limit',
          }),
        ],
      }),
    )

    expect({ apiResults, inputResults }).toEqual({
      apiResults: [
        {
          path: [
            'components',
            'ConsumerPage',
            'formulas',
            'readApiAndUrl',
            'formula',
            'arguments',
            0,
            'formula',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '6',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
      inputResults: [
        {
          path: ['components', 'ConsumerPage', 'apis', 'usersApi', 'url'],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '6',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
    })
  })

  test('it finds references to an API service, URL parameter, workflow parameter, and formula argument', () => {
    const serviceResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@service:Supabase' })],
      }),
    )
    const urlParamResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({ query: '@url-param:ConsumerPage/tab' }),
        ],
      }),
    )
    const wfParamResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@workflow-param:Broadcaster/"Emit event"/payload',
          }),
        ],
      }),
    )
    const formulaArgResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: '@formula-arg:Broadcaster/activeChannel/prefix',
          }),
        ],
      }),
    )

    expect({
      serviceResults,
      urlParamResults,
      wfParamResults,
      formulaArgResults,
    }).toEqual({
      serviceResults: [
        {
          path: ['components', 'ConsumerPage', 'apis', 'usersApi'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-api',
          },
        },
      ],
      urlParamResults: [
        {
          path: [
            'components',
            'ConsumerPage',
            'formulas',
            'readApiAndUrl',
            'formula',
            'arguments',
            1,
            'formula',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '7',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
      wfParamResults: [
        {
          path: [
            'components',
            'Broadcaster',
            'workflows',
            'wfEmit',
            'actions',
            0,
            'data',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'Broadcaster',
            'workflows',
            'wfInternal',
            'actions',
            '0',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '0',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
      formulaArgResults: [
        {
          path: [
            'components',
            'Broadcaster',
            'formulas',
            'bFormulaKey',
            'formula',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'Broadcaster',
            'formulas',
            'internalCaller',
            'formula',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
      ],
    })
  })

  test('it finds references to slots, CSS variables, animations, actions, and packages', () => {
    const slotResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@slot:Broadcaster/header' })],
      }),
    )
    const cssResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@css:--primary-color' })],
      }),
    )
    const animResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({ query: '@animation:ConsumerPage/fadeIn' }),
        ],
      }),
    )
    const actionResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@action:TrackEvent' })],
      }),
    )
    const pkgResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: '@package:ui' })],
      }),
    )

    expect({
      slotResults,
      cssResults,
      animResults,
      actionResults,
      pkgResults,
    }).toEqual({
      slotResults: [
        {
          path: ['components', 'Broadcaster', 'nodes', 'slotNode'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'slottedChild'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
      ],
      cssResults: [
        {
          path: [
            'components',
            'ConsumerPage',
            'nodes',
            'rootDiv',
            'style',
            'color',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'style-declaration',
          },
        },
        {
          path: ['themes', 'Default', 'propertyDefinitions', '--button-bg'],
          details: {
            context: null,
            field: null,
            nodeType: 'project-theme-property',
          },
        },
      ],
      animResults: [
        {
          path: [
            'components',
            'ConsumerPage',
            'nodes',
            'rootDiv',
            'style',
            'animation',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'style-declaration',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'nodes',
            'rootDiv',
            'animations',
            'fadeIn',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'animation',
          },
        },
      ],
      actionResults: [
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '3',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
      pkgResults: [
        {
          path: ['components', 'ConsumerPage', 'contexts', 'ui/PkgBadge'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-context',
          },
        },
        {
          path: ['components', 'ConsumerPage', 'nodes', 'pkgInstance'],
          details: {
            context: null,
            field: null,
            nodeType: 'component-node',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'formulas',
            'callPkgFormula',
            'formula',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'formula',
          },
        },
        {
          path: [
            'components',
            'ConsumerPage',
            'workflows',
            'onAction',
            'actions',
            '4',
          ],
          details: {
            context: null,
            field: null,
            nodeType: 'action-model',
          },
        },
      ],
    })
  })

  test('it filters by scope (in:...) and entity type (is:...)', () => {
    const pageResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [createFieldSearchRule({ query: 'is:page' })],
      }),
    )
    const scopedWorkflowResults = Array.from(
      searchProject({
        withDetails: false,
        files,
        rules: [
          createFieldSearchRule({
            query: 'in:Broadcaster is:workflow "Internal runner"',
          }),
        ],
      }),
    )

    expect({ pageResults, scopedWorkflowResults }).toEqual({
      pageResults: [
        {
          path: ['components', 'ConsumerPage'],
          details: {
            context: null,
            field: null,
            nodeType: 'component',
          },
        },
      ],
      scopedWorkflowResults: [
        {
          path: ['components', 'Broadcaster', 'workflows', 'wfInternal'],
          details: {
            context: {
              before: '',
              matched: 'Internal runner',
              after: '',
            },
            field: 'name',
            nodeType: 'component-workflow',
          },
        },
      ],
    })
  })

  test('it preserves freetext, exact quote, regex, and comma-array search', () => {
    const exactMatch = Array.from(
      searchProject({
        withDetails: true,
        files,
        rules: [createFieldSearchRule({ query: '"Submit order"' })],
      }),
    )
    const arrayPathMatch = Array.from(
      searchProject({
        withDetails: true,
        files,
        rules: [createFieldSearchRule({ query: 'Variables, isOpen' })],
      }),
    )
    const regexMatch = Array.from(
      searchProject({
        withDetails: true,
        files,
        rules: [createFieldSearchRule({ query: '/Company logo/' })],
      }),
    )

    expect({ exactMatch, arrayPathMatch, regexMatch }).toEqual({
      exactMatch: [
        {
          path: ['components', 'ConsumerPage', 'nodes', 'submitText', 'value'],
          details: {
            context: {
              before: '',
              matched: 'Submit order',
              after: '',
            },
            field: 'value',
            nodeType: 'formula',
          },
        },
      ],
      arrayPathMatch: [
        {
          path: [
            'components',
            'ConsumerPage',
            'formulas',
            'callGlobalFormula',
            'formula',
            'arguments',
            0,
            'formula',
          ],
          details: {
            context: {
              before: '',
              matched: 'Variables, isOpen',
              after: '',
            },
            field: 'path',
            nodeType: 'formula',
          },
        },
      ],
      regexMatch: [
        {
          path: [
            'components',
            'ConsumerPage',
            'nodes',
            'imgWithAlt',
            'attrs',
            'alt',
          ],
          details: {
            context: {
              before: '',
              matched: 'Company logo',
              after: '',
            },
            field: 'value',
            nodeType: 'formula',
          },
        },
      ],
    })
  })
})
