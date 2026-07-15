import { describe, expect, test } from 'bun:test'
import type { VariableActionModel } from '../component/component.types'
import type { GlobalFormulas } from '../formula/formulaTypes'
import { pathFormula, valueFormula } from '../formula/formulaUtils'
import { ToddleApiV2 } from './ToddleApiV2'
import type { ApiRequest } from './apiTypes'
import { ApiMethod } from './apiTypes'

describe('ToddleApiV2', () => {
  const mockGlobalFormulas: GlobalFormulas<any> = {}
  const mockApi: ApiRequest = {
    version: 2,
    name: 'test-api',
    type: 'http',
    autoFetch: valueFormula(true),
    url: valueFormula('https://api.example.com'),
    method: ApiMethod.GET,
    inputs: {
      id: { formula: valueFormula(123) },
    },
    headers: {
      'Content-Type': { formula: valueFormula('application/json') },
    },
    path: {
      node: { formula: valueFormula('users'), index: 0 },
    },
    queryParams: {
      q: { formula: valueFormula('search'), enabled: valueFormula(true) },
    },
    client: {
      onCompleted: {
        trigger: 'onCompleted',
        actions: [
          {
            type: 'SetVariable',
            variable: 'test',
            data: valueFormula('done'),
          },
        ],
      },
      debounce: {
        formula: valueFormula(100),
      },
    },
    redirectRules: {
      rule1: {
        formula: valueFormula('/login'),
        statusCode: valueFormula(302),
        index: 0,
      },
    },
    isError: {
      formula: valueFormula(false),
    },
    timeout: {
      formula: valueFormula(5000),
    },
    server: {
      proxy: {
        enabled: { formula: valueFormula(true) },
        useTemplatesInBody: { formula: valueFormula(false) },
      },
      ssr: {
        enabled: { formula: valueFormula(true) },
      },
    },
  }

  test('constructor and basic getters', () => {
    const api = new ToddleApiV2(mockApi, 'test-key', mockGlobalFormulas)
    expect(api.version).toBe(2)
    expect(api.name).toBe('test-api')
    expect(api.type).toBe('http')
    expect(api.autoFetch).toEqual(valueFormula(true))
    expect(api.url).toEqual(valueFormula('https://api.example.com'))
    expect(api.method).toBe(ApiMethod.GET)
    expect(api.inputs).toEqual(mockApi.inputs)
    expect(api.headers).toEqual(mockApi.headers)
    expect(api.path).toEqual(mockApi.path)
    expect(api.queryParams).toEqual(mockApi.queryParams)
    expect(api.client).toEqual(mockApi.client)
    expect(api.server).toEqual(mockApi.server)
    expect(api.redirectRules).toEqual(mockApi.redirectRules)
    expect(api.isError).toEqual(mockApi.isError)
    expect(api.timeout).toEqual(mockApi.timeout)
  })

  test('set headers', () => {
    const api = new ToddleApiV2({ ...mockApi }, 'test-key', mockGlobalFormulas)
    const newHeaders = { 'X-Test': { formula: valueFormula('testing') } }
    api.headers = newHeaders
    expect(api.headers).toEqual(newHeaders)
  })

  test('dependsOn (apiReferences) with various formula types', () => {
    const apiWithRefs: ApiRequest = {
      ...mockApi,
      url: pathFormula(['Apis', 'OtherApi', 'url']),
      queryParams: {
        q: {
          formula: {
            type: 'record',
            entries: [{ formula: pathFormula(['Apis', 'RecordApi', 'val']) }],
          },
        },
      },
      headers: {
        H: {
          formula: {
            type: 'function',
            name: 'concat',
            arguments: [
              { formula: pathFormula(['Apis', 'FunctionApi', 'val']) },
            ],
          },
        },
      },
      redirectRules: {
        rule1: {
          formula: {
            type: 'switch',
            default: valueFormula('/default'),
            cases: [
              {
                condition: valueFormula(true),
                formula: pathFormula(['Apis', 'SwitchApi', 'val']),
              },
            ],
          },
          statusCode: valueFormula(302),
          index: 0,
        },
      },
    }
    const api = new ToddleApiV2(apiWithRefs, 'test-key', mockGlobalFormulas)
    const dependencies = api.dependsOn
    expect(dependencies).toContain('OtherApi')
    expect(dependencies).toContain('RecordApi')
    expect(dependencies).toContain('FunctionApi')
    expect(dependencies).toContain('SwitchApi')
    expect(dependencies.length).toBe(4)
  })

  test('dependsOn ignores self-reference', () => {
    const apiWithSelfRef: ApiRequest = {
      ...mockApi,
      url: pathFormula(['Apis', 'test-key', 'url']),
    }
    const api = new ToddleApiV2(apiWithSelfRef, 'test-key', mockGlobalFormulas)
    expect(api.dependsOn).not.toContain('test-key')
  })

  test('formulasInApi yields all formulas', () => {
    const apiWithBody: ApiRequest = {
      ...mockApi,
      method: ApiMethod.POST,
      body: valueFormula({ foo: 'bar' }),
    }
    const api = new ToddleApiV2(apiWithBody, 'test-key', mockGlobalFormulas)
    const formulas = Array.from(api.formulasInApi())

    const formulaList = formulas.map((f) => f.formula)

    expect(formulaList).toContain(apiWithBody.autoFetch!)
    expect(formulaList).toContain(apiWithBody.url!)
    expect(formulaList).toContain(apiWithBody.inputs.id.formula!)
    expect(formulaList).toContain(apiWithBody.headers!['Content-Type'].formula)
    expect(formulaList).toContain(apiWithBody.path!.node.formula)
    expect(formulaList).toContain(apiWithBody.queryParams!.q.formula)
    expect(formulaList).toContain(apiWithBody.queryParams!.q.enabled!)
    expect(formulaList).toContain(apiWithBody.body!)
    expect(formulaList).toContain(apiWithBody.client!.debounce!.formula!)
    expect(formulaList).toContain(apiWithBody.redirectRules!.rule1.formula)
    expect(formulaList).toContain(apiWithBody.redirectRules!.rule1.statusCode!)
    expect(formulaList).toContain(apiWithBody.isError!.formula)
    expect(formulaList).toContain(apiWithBody.timeout!.formula)
    expect(formulaList).toContain(apiWithBody.server!.proxy!.enabled.formula)
    expect(formulaList).toContain(
      apiWithBody.server!.proxy!.useTemplatesInBody!.formula,
    )
    expect(formulaList).toContain(apiWithBody.server!.ssr!.enabled!.formula)

    // Check if it yields from actions as well
    const firstAction = apiWithBody.client!.onCompleted!.actions?.at(0)
    const actionFormula = (firstAction as VariableActionModel).data
    expect(formulaList).toContain(actionFormula)
  })

  test('formulasInApi skips body for GET requests', () => {
    const apiWithBody: ApiRequest = {
      ...mockApi,
      method: ApiMethod.GET,
      body: valueFormula({ foo: 'bar' }),
    }
    const api = new ToddleApiV2(apiWithBody, 'test-key', mockGlobalFormulas)
    const formulas = Array.from(api.formulasInApi())
    const formulaList = formulas.map((f) => f.formula)

    expect(formulaList).not.toContain(apiWithBody.body!)
  })

  test('actionModelsInApi yields actions', () => {
    const apiWithActions: ApiRequest = {
      ...mockApi,
      client: {
        onCompleted: {
          trigger: 'onCompleted',
          actions: [
            {
              type: 'SetVariable',
              variable: 'v1',
              data: valueFormula(1),
            },
          ],
        },
        onFailed: {
          trigger: 'onFailed',
          actions: [
            {
              type: 'SetVariable',
              variable: 'v2',
              data: valueFormula(2),
            },
          ],
        },
        onMessage: {
          trigger: 'onMessage',
          actions: [
            {
              type: 'SetVariable',
              variable: 'v3',
              data: valueFormula(3),
            },
          ],
        },
      },
    }
    const api = new ToddleApiV2(apiWithActions, 'test-key', mockGlobalFormulas)
    const actions = Array.from(api.actionModelsInApi())

    expect(actions).toHaveLength(3)
    const actionTypes = actions.map((a) => a[1].type)
    expect(actionTypes).toEqual(['SetVariable', 'SetVariable', 'SetVariable'])
  })
})
