import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/valueFormula'
import { beforeEach, describe, expect, mock, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import { EMPTY_COMPONENT_DATA } from './componentData'
import { env } from './global'
import { applyPreviewState } from './previewState'

describe('applyPreviewState', () => {
  beforeEach(() => {
    window.toddle = {
      ...window.toddle,
      locationSignal: signal<any>({
        path: '/',
        route: { path: [], query: {} },
        params: {},
        query: {},
      }),
    }
  })

  test('applies attribute and variable overrides to component dataSignal', () => {
    const component: Component = {
      name: 'Counter',
      attributes: {
        title: { name: 'title', testValue: 'Default Title' },
        initialCount: { name: 'initialCount', testValue: 0 },
      },
      variables: {
        count: {
          initialValue: valueFormula(10),
        },
      },
      nodes: {},
    }

    const dataSignal = signal<ComponentData>({
      ...EMPTY_COMPONENT_DATA,
      Attributes: { title: 'Default Title', initialCount: 0 },
      Variables: { count: 10 },
    })

    const syncOverlayRects = mock(() => {})

    applyPreviewState({
      overrides: {
        attributes: { title: 'Overridden Title' },
        variables: { count: 99 },
      },
      component,
      dataSignal,
      ctx: null,
      env,
      syncOverlayRects,
    })

    expect(dataSignal.get().Attributes).toEqual({
      title: 'Overridden Title',
      initialCount: 0,
    })
    expect(dataSignal.get().Variables).toEqual({
      count: 99,
    })
    expect(syncOverlayRects).toHaveBeenCalledTimes(1)
  })

  test('restores default attribute and variable values when overrides are cleared with null', () => {
    const component: Component = {
      name: 'Counter',
      attributes: {
        title: { name: 'title', testValue: 'Default Title' },
      },
      variables: {
        count: {
          initialValue: valueFormula(10),
        },
      },
      nodes: {},
    }

    const dataSignal = signal<ComponentData>({
      ...EMPTY_COMPONENT_DATA,
      Attributes: { title: 'Overridden Title' },
      Variables: { count: 99 },
    })

    applyPreviewState({
      overrides: null,
      component,
      dataSignal,
      ctx: null,
      env,
    })

    expect(dataSignal.get().Attributes).toEqual({
      title: 'Default Title',
    })
    expect(dataSignal.get().Variables).toEqual({
      count: 10,
    })
  })

  test('applies route path and query overrides to page component and updates locationSignal', () => {
    const pageComponent: Component = {
      name: 'UserPage',
      route: {
        path: [
          { name: 'users', type: 'static' },
          { name: 'id', type: 'param', testValue: '1' },
        ],
        query: {
          tab: { name: 'tab', testValue: 'overview' },
        },
      },
      variables: {
        isLoaded: {
          initialValue: valueFormula(true),
        },
      },
      nodes: {},
    }

    const dataSignal = signal<ComponentData>({
      ...EMPTY_COMPONENT_DATA,
      'URL parameters': { id: '1', tab: 'overview' },
      Attributes: { id: '1', tab: 'overview' },
      Variables: { isLoaded: true },
    })

    applyPreviewState({
      overrides: {
        path: { id: '42' },
        query: { tab: 'settings' },
        variables: { isLoaded: false },
      },
      component: pageComponent,
      dataSignal,
      ctx: null,
      env,
    })

    expect(window.toddle.locationSignal.get().params).toEqual({ id: '42' })
    expect(window.toddle.locationSignal.get().query).toEqual({
      tab: 'settings',
    })
    expect(dataSignal.get()['URL parameters']).toEqual({
      id: '42',
      tab: 'settings',
    })
    expect(dataSignal.get().Attributes).toEqual({
      id: '42',
      tab: 'settings',
    })
    expect(dataSignal.get().Variables).toEqual({
      isLoaded: false,
    })
  })

  test('switches context provider test scenario from consumer component', () => {
    const authProvider: Component = {
      name: 'AuthProvider',
      attributes: {},
      variables: {
        user: {
          initialValue: valueFormula(null),
        },
      },
      formulas: {
        currentUser: {
          formula: {
            type: 'path',
            path: ['Variables', 'user'],
          },
        },
      },
      nodes: {},
      testScenarios: {
        'Logged in': {
          variables: {
            user: { id: 'user-1', name: 'Alice' },
          },
        },
      },
    }

    const consumerComponent: Component = {
      name: 'UserProfile',
      attributes: {},
      variables: {},
      contexts: {
        AuthProvider: {
          componentName: 'AuthProvider',
          formulas: ['currentUser'],
          workflows: [],
        },
      },
      nodes: {},
    }

    const dataSignal = signal<ComponentData>({
      ...EMPTY_COMPONENT_DATA,
      Contexts: {
        AuthProvider: {
          currentUser: null,
        },
      },
    })

    // Apply scenario override pointing to 'Logged in' on AuthProvider
    applyPreviewState({
      overrides: {
        contexts: {
          AuthProvider: 'Logged in',
        },
      },
      component: consumerComponent,
      components: [authProvider, consumerComponent],
      dataSignal,
      ctx: null,
      env,
    })

    expect(dataSignal.get().Contexts).toEqual({
      AuthProvider: {
        currentUser: { id: 'user-1', name: 'Alice' },
      },
    })

    // Reverting with null restores the default provider state
    applyPreviewState({
      overrides: null,
      component: consumerComponent,
      components: [authProvider, consumerComponent],
      dataSignal,
      ctx: null,
      env,
    })

    expect(dataSignal.get().Contexts).toEqual({
      AuthProvider: {
        currentUser: null,
      },
    })
  })

  test('applies API mock overrides to dataSignal', () => {
    const component: Component = {
      name: 'UserList',
      attributes: {},
      variables: {},
      nodes: {},
    }

    const dataSignal = signal<ComponentData>({
      ...EMPTY_COMPONENT_DATA,
      Apis: {
        getUsers: {
          isLoading: false,
          data: null,
          error: null,
        },
      },
    })

    applyPreviewState({
      overrides: {
        apis: {
          getUsers: {
            isLoading: false,
            data: [{ id: '1', name: 'John' }],
            error: null,
          },
        },
      },
      component,
      dataSignal,
      ctx: null,
      env,
    })

    expect(dataSignal.get().Apis?.getUsers?.data).toEqual([
      { id: '1', name: 'John' },
    ])

    // Reverting with null clears API overrides
    applyPreviewState({
      overrides: null,
      component,
      dataSignal,
      ctx: null,
      env,
    })

    expect(dataSignal.get().Apis?.getUsers).toBeUndefined()
  })
})
