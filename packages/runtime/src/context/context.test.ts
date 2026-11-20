/* eslint-disable no-console */
import type { Component, ComponentData, Toddle } from '@nordcraft/core'
import { afterEach, describe, expect, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import type {
  ComponentContext,
  Location,
  LocationSignal,
  PreviewShowSignal,
} from '../types'
import { isContextProvider } from './isContextProvider'
import { subscribeToContext } from './subscribeToContext'

const createContextFixture = (component: Component): ComponentContext => {
  const locationSignal = signal<Location>({
    route: undefined,
    query: {},
    params: {},
    page: '/',
    path: '/',
    hash: '',
  })
  const toddle: Toddle<LocationSignal, PreviewShowSignal> = {
    isEqual: () => false,
    errors: [],
    project: 'test',
    branch: 'main',
    commit: 'HEAD',
    components: [component],
    formulas: {},
    actions: {},
    registerAction: () => {},
    getAction: () => undefined,
    registerFormula: () => {},
    getFormula: () => undefined,
    getCustomAction: () => undefined,
    getCustomFormula: () => undefined,
    // eslint-disable-next-line max-params
    getArgumentInputData: (_f, _a, _i, d) => d,
    data: {},
    locationSignal,
    eventLog: [],
    pageState: { Apis: {} },
    env: {
      isServer: false,
      branchName: 'main',
      request: undefined,
      runtime: 'page',
      logErrors: false,
    },
  }
  return {
    triggerEvent: () => {},
    component,
    components: [component],
    dataSignal: signal<ComponentData>({}),
    isRootComponent: false,
    apis: {},
    formulaCache: {},
    children: {},
    abortSignal: new AbortController().signal,
    root: document,
    providers: {},
    stores: { theme: signal<string | null>(null) },
    package: undefined,
    toddle,
    env: toddle.env,
  }
}

describe('context utilities', () => {
  const originalPreview = globalThis.IS_PREVIEW
  const originalWarn = console.warn

  afterEach(() => {
    globalThis.IS_PREVIEW = originalPreview
    console.warn = originalWarn
  })

  test('isContextProvider caches lookup result per component instance', () => {
    let formulaReads = 0
    const formulas: Component['formulas'] = {
      sharedValue: {
        name: 'sharedValue',
        arguments: [],
        exposeInContext: true,
        formula: { type: 'value', value: 1 },
      },
    }
    const providerByFormula: Component = {
      name: 'FormulaProvider',
      nodes: {},
    }
    Object.defineProperty(providerByFormula, 'formulas', {
      get() {
        formulaReads++
        return formulas
      },
    })

    const providerByWorkflow: Component = {
      name: 'WorkflowProvider',
      workflows: {
        doWork: {
          name: 'doWork',
          parameters: [],
          actions: [],
          exposeInContext: true,
        },
      },
      nodes: {},
    }

    const plainComponent: Component = {
      name: 'PlainComponent',
      formulas: {
        internalOnly: {
          name: 'internalOnly',
          arguments: [],
          exposeInContext: false,
          formula: { type: 'value', value: 2 },
        },
      },
      nodes: {},
    }

    expect({
      first: isContextProvider(providerByFormula),
      second: isContextProvider(providerByFormula),
      formulaReads,
      workflowProvider: isContextProvider(providerByWorkflow),
      plain: isContextProvider(plainComponent),
    }).toEqual({
      first: true,
      second: true,
      formulaReads: 1,
      workflowProvider: true,
      plain: false,
    })
  })

  test('subscribeToContext only logs missing exposed formula warnings in preview', () => {
    const providerComponent: Component = {
      name: 'ThemeProvider',
      formulas: {},
      nodes: {},
    }
    const consumerComponent: Component = {
      name: 'ThemeConsumer',
      contexts: {
        ThemeProvider: {
          formulas: ['missingFormula'],
          workflows: [],
        },
      },
      nodes: {},
    }

    const ctx = createContextFixture(consumerComponent)
    ctx.providers = {
      ThemeProvider: {
        component: providerComponent,
        formulaDataSignals: {
          existingFormula: signal<ComponentData>({ Variables: {} }),
        },
        ctx,
      },
    }

    const previewWarnings: string[] = []
    const pageWarnings: string[] = []

    globalThis.IS_PREVIEW = true
    console.warn = (...args: unknown[]) => {
      previewWarnings.push(args.map(String).join(' '))
    }
    subscribeToContext(signal<ComponentData>({}), consumerComponent, ctx)

    globalThis.IS_PREVIEW = false
    console.warn = (...args: unknown[]) => {
      pageWarnings.push(args.map(String).join(' '))
    }
    subscribeToContext(signal<ComponentData>({}), consumerComponent, ctx)

    expect({ previewWarnings, pageWarnings }).toEqual({
      previewWarnings: [
        'Component error(ThemeConsumer): Provider ThemeProvider does not expose a formula named "missingFormula". Available formulas are: ["existingFormula"]',
      ],
      pageWarnings: [],
    })
  })
})
