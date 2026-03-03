import { ApiMethod } from '@nordcraft/core/dist/api/apiTypes'
import { ToddleApiV2 } from '@nordcraft/core/dist/api/ToddleApiV2'
import type {
  FormulaContext,
  ToddleServerEnv,
} from '@nordcraft/core/dist/formula/formula'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { evaluateComponentApis } from './api'

const spyFetch = spyOn(globalThis, 'fetch')

describe('evaluateComponentApis', () => {
  beforeEach(() => {
    spyFetch.mockReset()
  })

  it('should fetch enabled and auto-fetched APIs', async () => {
    const mockApi = new ToddleApiV2(
      {
        name: 'testApi',
        version: 2,
        type: 'http',
        url: { type: 'value', value: 'https://example.com/api' },
        method: ApiMethod.GET,
        inputs: {},
        autoFetch: { type: 'value', value: true },
        server: {
          ssr: {
            enabled: { formula: valueFormula(true) },
          },
        },
      },
      'testApi',
      {},
    )

    const formulaContext: FormulaContext = {
      component: { name: 'TestComponent' },
      data: {
        Apis: {},
        Variables: {},
        Attributes: {},
        Contexts: {},
      },
      package: null,
      toddle: {
        getFormula: () => undefined,
        getCustomFormula: () => undefined,
        errors: [],
      },
      env: {
        branchName: 'main',
        isServer: true,
        request: {
          headers: {},
          cookies: {},
          url: 'http://localhost:3000',
        },
        logErrors: false,
      } as ToddleServerEnv,
    }

    const mockResponse = async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })

    spyFetch.mockImplementation(mockResponse as any)

    const result = await evaluateComponentApis({
      component: {
        name: 'TestComponent',
        apis: {
          testApi: mockApi,
        },
      } as any,
      formulaContext,
      req: new Request('http://localhost:3000'),
      apiCache: {},
      updateApiCache: () => {},
    })

    expect(result['testApi']?.data).toEqual({ success: true })
    expect(spyFetch).toHaveBeenCalled()
  })

  it('should not fetch APIs where SSR is disabled', async () => {
    const mockApi = new ToddleApiV2(
      {
        name: 'disabledApi',
        version: 2,
        type: 'http',
        url: { type: 'value', value: 'https://example.com/api' },
        method: ApiMethod.GET,
        inputs: {},
        autoFetch: { type: 'value', value: true },
        server: {
          ssr: {
            enabled: { formula: valueFormula(false) },
          },
        },
      },
      'disabledApi',
      {},
    )

    const formulaContext: FormulaContext = {
      component: { name: 'TestComponent' },
      data: { Apis: {}, Variables: {}, Attributes: {}, Contexts: {} },
      package: null,
      toddle: {
        getFormula: () => undefined,
        getCustomFormula: () => undefined,
        errors: [],
      },
      env: {
        branchName: 'main',
        isServer: true,
        request: { headers: {}, cookies: {}, url: 'http://localhost:3000' },
        logErrors: false,
      } as ToddleServerEnv,
    }

    const result = await evaluateComponentApis({
      component: {
        name: 'TestComponent',
        apis: {
          disabledApi: mockApi,
        },
      } as any,
      formulaContext,
      req: new Request('http://localhost:3000'),
      apiCache: {},
      updateApiCache: () => {},
    })

    expect(result['disabledApi']?.data).toBeNull()
    expect(result['disabledApi']?.isLoading).toBe(true)
    expect(spyFetch).not.toHaveBeenCalled()
  })

  it('should handle dependent APIs in order', async () => {
    const api1 = new ToddleApiV2(
      {
        name: 'api1',
        version: 2,
        type: 'http',
        url: { type: 'value', value: 'https://example.com/api1' },
        method: ApiMethod.GET,
        inputs: {},
        autoFetch: { type: 'value', value: true },
        server: { ssr: { enabled: { formula: valueFormula(true) } } },
      },
      'api1',
      {},
    )

    const api2 = new ToddleApiV2(
      {
        name: 'api2',
        version: 2,
        type: 'http',
        url: { type: 'value', value: 'https://example.com/api2' },
        method: ApiMethod.GET,
        inputs: {},
        autoFetch: { type: 'value', value: true },
        server: { ssr: { enabled: { formula: valueFormula(true) } } },
      },
      'api2',
      {},
    )

    Object.defineProperty(api2, 'apiReferences', {
      get: () => new Set(['api1']),
    })

    const formulaContext: FormulaContext = {
      component: { name: 'TestComponent' },
      data: { Apis: {}, Variables: {}, Attributes: {}, Contexts: {} },
      package: null,
      toddle: {
        getFormula: () => undefined,
        getCustomFormula: () => undefined,
        errors: [],
      },
      env: {
        branchName: 'main',
        isServer: true,
        request: { headers: {}, cookies: {}, url: 'http://localhost:3000' },
        logErrors: false,
      } as ToddleServerEnv,
    }

    let callCount = 0

    const mockResponse = async (req: Request) => {
      callCount++
      const url = typeof req === 'string' ? req : (req as Request).url
      if (url.includes('api1')) {
        return new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.includes('api2')) {
        return new Response(JSON.stringify({ id: 2 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response('Not Found', { status: 404 })
    }

    spyFetch.mockImplementation(mockResponse as any)

    const result = await evaluateComponentApis({
      component: {
        name: 'TestComponent',
        apis: {
          api1,
          api2,
        },
      } as any,
      formulaContext,
      req: new Request('http://localhost:3000'),
      apiCache: {},
      updateApiCache: () => {},
    })

    expect(result['api1']?.data).toEqual({ id: 1 })
    expect(result['api2']?.data).toEqual({ id: 2 })
    expect(callCount).toBe(2)
  })

  it('should replace request body template value with cookie value', async () => {
    const mockApi = new ToddleApiV2(
      {
        name: 'testApi',
        version: 2,
        type: 'http',
        url: valueFormula('https://example.com/api'),
        method: ApiMethod.POST,
        inputs: {},
        autoFetch: valueFormula(true),
        server: {
          ssr: {
            enabled: { formula: valueFormula(true) },
          },
          proxy: {
            enabled: { formula: valueFormula(true) },
            useTemplatesInBody: { formula: valueFormula(true) },
          },
        },
        body: valueFormula('{"token": "{{ cookies.session_id }}"}'),
      },
      'testApi',
      {},
    )

    const formulaContext: FormulaContext = {
      component: { name: 'TestComponent' },
      data: {
        Apis: {},
        Variables: {},
        Attributes: {},
        Contexts: {},
      },
      package: null,
      toddle: {
        getFormula: () => undefined,
        getCustomFormula: () => undefined,
        errors: [],
      },
      env: {
        branchName: 'main',
        isServer: true,
        request: {
          headers: {},
          cookies: { session_id: 'my-session-id' } as Record<string, string>,
          url: 'http://localhost:3000',
        },
        logErrors: false,
      } as ToddleServerEnv,
    }

    const mockPostResponse = async (req: Request) => {
      const actualReq = req as Request
      const bodyText = await actualReq.text()
      const body = JSON.parse(
        typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText,
      )
      return new Response(
        JSON.stringify({ success: true, receivedToken: body.token }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      )
    }

    spyFetch.mockImplementation(mockPostResponse as any)

    const result = await evaluateComponentApis({
      component: {
        name: 'TestComponent',
        apis: { testApi: mockApi },
      } as any,
      formulaContext,
      req: new Request('http://localhost:3000'),
      apiCache: {},
      updateApiCache: () => {},
    })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect(result['testApi']?.data).toEqual({
      success: true,
      receivedToken: 'my-session-id',
    })
    expect(spyFetch).toHaveBeenCalled()
  })
})
