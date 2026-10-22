import { ApiMethod, type ApiRequest } from '@nordcraft/core/dist/api/apiTypes'
import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { createAPI } from './createAPIv2'

describe('createAPI (v2)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    window.__toddle = {
      isPageLoaded: true,
    } as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const createMockCtx = (
    dataSignal: ReturnType<typeof signal<ComponentData>>,
  ) =>
    ({
      component: {
        name: 'TestComponent',
        nodes: {},
        apis: {},
      },
      components: [],
      package: undefined,
      abortSignal: new AbortController().signal,
      root: document,
      isRootComponent: true,
      dataSignal,
      triggerEvent: () => {},
      apis: {},
      children: {},
      formulaCache: {},
      providers: {},
      stores: {
        theme: signal(null),
      },
      toddle: {
        pageState: { Apis: {} },
        errors: [],
        getCustomFormula: () => undefined,
        getCustomAction: () => undefined,
        getFormula: () => undefined,
        getAction: () => undefined,
        locationSignal: signal({
          route: undefined,
          path: '/',
          params: {},
          query: {},
        }),
      } as any,
      env: {
        runtime: 'page',
        isServer: false,
        branchName: 'main',
        request: undefined,
        logErrors: false,
      },
    }) as unknown as ComponentContext

  test('onCompleted actions read live Apis[name].data and Variables from ctx.dataSignal', async () => {
    let resolveFetch!: (value: Response) => void
    globalThis.fetch = mock(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    ) as unknown as typeof fetch

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        files: null,
        otherVar: 'initial',
        combined: null,
      },
      Apis: {
        'Load files': {
          data: null,
          isLoading: true,
          error: null,
        },
      },
    })

    const ctx = createMockCtx(dataSignal)
    const apiRequest: ApiRequest = {
      version: 2,
      name: 'Load files',
      type: 'http',
      method: ApiMethod.GET,
      url: { type: 'value', value: 'https://example.com/api/files' },
      autoFetch: { type: 'value', value: true },
      inputs: {},
      server: {
        proxy: {
          enabled: { formula: { type: 'value', value: false } },
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
              data: {
                type: 'path',
                path: ['Apis', 'Load files', 'data', 'items'],
              },
            },
            {
              type: 'SetVariable',
              variable: 'combined',
              data: {
                type: 'object',
                arguments: [
                  {
                    name: 'files',
                    formula: {
                      type: 'path',
                      path: ['Variables', 'files'],
                    },
                  },
                  {
                    name: 'otherVar',
                    formula: {
                      type: 'path',
                      path: ['Variables', 'otherVar'],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    }

    // Snapshot taken at component initialization where Apis['Load files'].data is still null
    const initialComponentData = structuredClone(dataSignal.get())

    createAPI({
      apiRequest,
      componentData: initialComponentData,
      ctx,
    })

    // Simulate another variable updating while the slow API request is still in-flight
    dataSignal.update((data) => ({
      ...data,
      Variables: {
        ...data.Variables,
        otherVar: 'updated-while-in-flight',
      },
    }))

    // Resolve the in-flight response
    resolveFetch(
      new Response(JSON.stringify({ items: ['file1.json', 'file2.json'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    // Wait for async response handling to complete
    await new Promise((r) => setTimeout(r, 20))

    expect(dataSignal.get().Apis?.['Load files']?.data).toEqual({
      items: ['file1.json', 'file2.json'],
    })
    expect(dataSignal.get().Variables?.files).toEqual([
      'file1.json',
      'file2.json',
    ])
    expect(dataSignal.get().Variables?.combined).toEqual({
      files: ['file1.json', 'file2.json'],
      otherVar: 'updated-while-in-flight',
    })
  })

  test('autoFetch re-evaluates using live signal data', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        shouldFetch: false,
      },
      Apis: {},
    })

    const ctx = createMockCtx(dataSignal)
    const apiRequest: ApiRequest = {
      version: 2,
      name: 'Conditional API',
      type: 'http',
      method: ApiMethod.GET,
      url: { type: 'value', value: 'https://example.com/api/conditional' },
      autoFetch: {
        type: 'path',
        path: ['Variables', 'shouldFetch'],
      },
      inputs: {},
      server: {
        proxy: {
          enabled: { formula: { type: 'value', value: false } },
        },
      },
      client: {
        parserMode: 'json',
      },
    }

    const initialComponentData = structuredClone(dataSignal.get())

    createAPI({
      apiRequest,
      componentData: initialComponentData,
      ctx,
    })

    expect(fetchMock).toHaveBeenCalledTimes(0)

    // Flip shouldFetch to true in live signal
    dataSignal.update((data) => ({
      ...data,
      Variables: {
        ...data.Variables,
        shouldFetch: true,
      },
    }))

    await new Promise((r) => setTimeout(r, 20))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(dataSignal.get().Apis?.['Conditional API']?.data).toEqual({
      ok: true,
    })
  })

  test('fetch preserves componentData properties (e.g. Parameters) while concatenating live signal data over it', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ saved: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ) as unknown as typeof fetch

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        result: null,
      },
      Apis: {},
    })

    const ctx = createMockCtx(dataSignal)
    const apiRequest: ApiRequest = {
      version: 2,
      name: 'Save API',
      type: 'http',
      method: ApiMethod.POST,
      url: { type: 'value', value: 'https://example.com/api/save' },
      autoFetch: { type: 'value', value: false },
      inputs: {},
      server: {
        proxy: {
          enabled: { formula: { type: 'value', value: false } },
        },
      },
      client: {
        parserMode: 'json',
      },
    }

    const api = createAPI({
      apiRequest,
      componentData: dataSignal.get(),
      ctx,
    })

    await api.fetch({
      componentData: {
        ...dataSignal.get(),
        Parameters: {
          workflowParam: 'from-workflow',
        },
      },
      actionModels: {
        onCompleted: [
          {
            type: 'SetVariable',
            variable: 'result',
            data: {
              type: 'object',
              arguments: [
                {
                  name: 'apiData',
                  formula: {
                    type: 'path',
                    path: ['Apis', 'Save API', 'data', 'saved'],
                  },
                },
                {
                  name: 'param',
                  formula: {
                    type: 'path',
                    path: ['Parameters', 'workflowParam'],
                  },
                },
              ],
            },
          },
        ],
        onFailed: [],
        onMessage: [],
      },
    })

    expect(dataSignal.get().Variables?.result).toEqual({
      apiData: true,
      param: 'from-workflow',
    })
  })
})
