import { describe, expect, it, test } from 'bun:test'
import { valueFormula } from '../formula/formulaUtils'
import {
  createApiRequest,
  getRequestHeaders,
  getRequestPath,
  getRequestQueryParams,
  getUrl,
} from './api'
import type { ApiRequest } from './apiTypes'
import { ApiMethod } from './apiTypes'

describe('getApiPath()', () => {
  test('it returns a valid url path string', () => {
    expect(getRequestPath({}, undefined as any)).toBe('')
    expect(
      getRequestPath(
        {
          first: { formula: valueFormula('hello'), index: 0 },
          second: { formula: valueFormula('world'), index: 1 },
        },
        undefined as any,
      ),
    ).toBe('hello/world')
  })
})
describe('getQueryParams()', () => {
  test('it returns a valid url path string', () => {
    const emptyParams = getRequestQueryParams({}, undefined as any)
    expect(emptyParams.size).toBe(0)
    const params = getRequestQueryParams(
      {
        q: {
          formula: valueFormula('hello'),
          enabled: valueFormula(true),
        },
        filter: {
          formula: valueFormula('world'),
          enabled: valueFormula(true),
        },
        unused: {
          formula: valueFormula('test'),
          enabled: valueFormula(false),
        },
      },
      undefined as any,
    )
    expect(params.get('q')).toBe('hello')
    expect(params.get('filter')).toBe('world')
    expect(params.get('unused')).toBeNull()
    expect(params.size).toBe(2)
  })
  test('it stringifies arrays', () => {
    const params = getRequestQueryParams(
      {
        q: {
          formula: valueFormula(['hello', 'world']),
          enabled: valueFormula(true),
        },
      },
      undefined as any,
    )
    expect(params.getAll('q')).toEqual(['hello', 'world'])
    expect(params.size).toBe(2)
  })
  test('it stringifies objects', () => {
    const params = getRequestQueryParams(
      {
        q: {
          formula: valueFormula({ a: 'hello', b: { c: 'world', d: [] } }),
          enabled: valueFormula(true),
        },
      },
      undefined as any,
    )
    expect(params.get('q[a]')).toEqual('hello')
    expect(params.get('q[b][c]')).toEqual('world')
    expect(params.get('q[b][d]')).toEqual('')
    expect(params.size).toBe(3)
  })
})
describe('getUrl()', () => {
  test('it returns a valid url for null url', () => {
    const url = getUrl(
      {
        url: valueFormula(null),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
        queryParams: {
          q: {
            formula: valueFormula('test'),
          },
        },
      },
      undefined as any,
      'https://example.com',
    )
    expect(url.href).toBe('https://example.com/hello/world?q=test')
  })
  test('it returns a valid url for url with included path params', () => {
    const url = getUrl(
      {
        url: valueFormula('https://example.com/test/path'),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
        queryParams: {
          q: {
            formula: valueFormula('test'),
          },
        },
      },
      undefined as any,
      'https://example.com',
    )
    expect(url.href).toBe('https://example.com/test/path/hello/world?q=test')
  })
  test('it ignores trailing slashes in urls', () => {
    const url = getUrl(
      {
        url: valueFormula('https://example.com/test/path/'),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
      },
      undefined as any,
      'https://example.com',
    )
    expect(url.href).toBe('https://example.com/test/path/hello/world')
  })
  test('numbers are accepted as path parameters in url definition', () => {
    const url = getUrl(
      {
        url: valueFormula(88),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
      },
      undefined as any,
      'https://example.com',
    )
    expect(url.href).toBe('https://example.com/88/hello/world')
  })
  test('supports relative urls', () => {
    const url = getUrl(
      {
        url: valueFormula('/test/path/'),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
      },
      undefined as any,
      'https://mysite.com',
    )
    expect(url.href).toBe('https://mysite.com/test/path/hello/world')
  })
  test('supports query parameters in url declaration', () => {
    const url = getUrl(
      {
        url: valueFormula('/test/path/?q=test&hello=world'),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
        queryParams: {
          search: {
            formula: valueFormula('test'),
          },
        },
      },
      undefined as any,
      'https://mysite.com',
    )
    expect(url.href).toBe(
      'https://mysite.com/test/path/hello/world?q=test&hello=world&search=test',
    )
  })
  test('supports hash parameter', () => {
    const url = getUrl(
      {
        url: valueFormula('https://mysite.com/test/path/?q=test&hello=world'),
        path: {
          a: { formula: valueFormula('hello'), index: 0 },
          b: { formula: valueFormula('world'), index: 1 },
        },
        queryParams: {
          search: {
            formula: valueFormula('test'),
          },
        },
        hash: { formula: valueFormula('my-hash') },
      },
      undefined as any,
      'https://mysite.com',
    )
    expect(url.hash).toBe('#my-hash')
    expect(url.href).toBe(
      'https://mysite.com/test/path/hello/world?q=test&hello=world&search=test#my-hash',
    )
  })
})
describe('getApiHeaders()', () => {
  test('it returns valid headers', () => {
    const emptyParams = getRequestHeaders({
      apiHeaders: {},
      formulaContext: undefined as any,
      defaultHeaders: undefined,
    })
    expect(emptyParams.entries.length).toBe(0)
    const headers = getRequestHeaders({
      apiHeaders: {
        q: { formula: valueFormula('hello') },
        filter: { formula: valueFormula('world') },
      },
      formulaContext: undefined as any,
      defaultHeaders: undefined,
    })
    expect(headers.get('q')).toBe('hello')
    expect(headers.get('filter')).toBe('world')
    expect([...headers.entries()].length).toBe(2)
    const headersWithDefaults = getRequestHeaders({
      apiHeaders: {
        q: { formula: valueFormula('hello') },
        filter: { formula: valueFormula('world') },
      },
      formulaContext: undefined as any,
      defaultHeaders: new Headers([['accept-encoding', 'gzip']]),
    })
    expect(headersWithDefaults.get('q')).toBe('hello')
    expect(headersWithDefaults.get('filter')).toBe('world')
    expect(headersWithDefaults.get('accept-encoding')).toBe('gzip')
    expect([...headersWithDefaults.entries()].length).toBe(3)
  })
  test('it ignores disabled headers', () => {
    const headers = getRequestHeaders({
      apiHeaders: {
        q: { formula: valueFormula('hello') },
        test: {
          formula: valueFormula('hidden'),
          enabled: valueFormula(false),
        },
        filter: { formula: valueFormula('world') },
      },
      formulaContext: undefined as any,
      defaultHeaders: undefined,
    })
    expect(headers.get('q')).toBe('hello')
    expect(headers.get('filter')).toBe('world')
    expect(headers.get('test')).toBe(null)
    expect([...headers.entries()].length).toBe(2)
  })
})
describe('createApiRequest', () => {
  const baseUrl = 'https://example.com'
  it('creates a GET request with minimal arguments', () => {
    const apiRequest: ApiRequest = {
      name: 'Test API',
      type: 'http',
      path: {},
      queryParams: {},
      method: ApiMethod.GET,
      url: valueFormula('service'),
      version: 2,
      inputs: {},
      server: {
        proxy: null,
        ssr: {
          enabled: { formula: valueFormula(true) },
        },
      },
      client: {
        parserMode: 'auto',
      },
    }

    const { url, requestSettings } = createApiRequest({
      api: apiRequest,
      formulaContext: undefined as any,
      baseUrl,
      defaultHeaders: undefined,
    })
    const request = new Request(url, requestSettings)
    expect(request.method).toBe('GET')
    expect(request.url).toBe('https://example.com/service')
  })

  it('creates a POST request with all arguments', () => {
    const apiRequest: ApiRequest = {
      name: 'Test API',
      type: 'http',
      version: 2,
      inputs: {},
      path: {
        first: { formula: valueFormula('hello'), index: 0 },
        second: { formula: valueFormula('world'), index: 1 },
      },
      queryParams: {
        q: {
          formula: valueFormula('hello'),
          enabled: valueFormula(true),
        },
        filter: {
          formula: valueFormula('world'),
          enabled: valueFormula(true),
        },
        unused: {
          formula: valueFormula('test'),
          enabled: valueFormula(false),
        },
      },
      method: ApiMethod.POST,
      url: valueFormula('service'),
      headers: {
        'Content-Type': {
          formula: valueFormula('application/json'),
        },
      },
      body: valueFormula('{"key":"value"}'),
    }

    const { url, requestSettings } = createApiRequest({
      api: apiRequest,
      formulaContext: undefined as any,
      baseUrl,
      defaultHeaders: undefined,
    })
    const request = new Request(url, requestSettings)
    expect(request.method).toBe('POST')
    expect(request.url).toBe(
      'https://example.com/service/hello/world?q=hello&filter=world',
    )
    expect(request.headers.get('Content-Type')).toBe('application/json')
  })

  // TODO: Add tests for the http body
})
