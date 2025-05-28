import { STRING_TEMPLATE } from '@nordcraft/core/dist/api/template'
import { PROXY_URL_HEADER } from '@nordcraft/core/dist/utils/url'
import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { proxyRequestHandler } from './apiProxy'

const spyFetch = spyOn(globalThis, 'fetch')

describe('API proxy', () => {
  beforeEach(() => {
    spyFetch.mockReset()
  })
  it('Should proxy a request to the correct url', async () => {
    // Create the test client from the app instance
    const client = testClient(
      new Hono().get(
        '.toddle/omvej/components/:componentName/apis/:apiName',
        proxyRequestHandler,
      ),
    )
    const targetUrl = new URL(
      'https://example.com/api?param1=value1&param2=value2',
    )
    const mockGetExample = async (req: Request) => {
      const url = new URL(req.url)
      expect(url.pathname).toBe(targetUrl.pathname)
      expect(url.searchParams.get('param1')).toBe(
        targetUrl.searchParams.get('param1'),
      )
      expect(url.searchParams.get('param2')).toBe(
        targetUrl.searchParams.get('param2'),
      )
      // The PROXY_URL_HEADER should be removed from the request headers
      expect(req.headers.get(PROXY_URL_HEADER)).toBeNull()
      expect(req.headers.get('Authorization')).toBe(`Bearer my_value`)
      return new Response(`{"success":true}`)
    }

    spyFetch.mockImplementation(mockGetExample as any)
    const res = await client['.toddle'].omvej.components[':componentName'].apis[
      ':apiName'
    ].$get(
      {
        param: {
          componentName: 'MyComponent',
          apiName: 'MyApi',
        },
      },
      {
        headers: {
          [PROXY_URL_HEADER]: targetUrl.href,
          Authorization: `Bearer ${STRING_TEMPLATE('cookies', 'my_cookie')}`,
          Cookie: `my_cookie=my_value; other_cookie=other_value`,
        },
      },
    )
    expect(res.status).toBe(200)
  })
  it('Should replace the request body with template values', async () => {
    // Create the test client from the app instance
    const client = testClient(
      new Hono().post(
        '.toddle/omvej/components/:componentName/apis/:apiName',
        proxyRequestHandler,
      ),
    )
    const targetUrl = new URL(
      'https://example.com/api?param1=value1&param2=value2',
    )
    const mockPostExample = async (req: Request) => {
      const url = new URL(req.url)
      expect(url.pathname).toBe(targetUrl.pathname)
      expect(url.searchParams.get('param1')).toBe(
        targetUrl.searchParams.get('param1'),
      )
      expect(url.searchParams.get('param2')).toBe(
        targetUrl.searchParams.get('param2'),
      )
      expect(req.method).toBe('POST')
      console.log('Incoming request', req)
      const body = await req.text()
      expect(body).toBe('hello world') // The body should not be modified
      // The PROXY_URL_HEADER should be removed from the request headers
      expect(req.headers.get(PROXY_URL_HEADER)).toBeNull()
      return new Response(`{"success":true}`)
    }

    spyFetch.mockImplementation(mockPostExample as any)
    const res = await client['.toddle'].omvej.components[':componentName'].apis[
      ':apiName'
    ].$post(
      {
        param: {
          componentName: 'MyComponent',
          apiName: 'MyApi',
        },
        // body: { test: 'hello' },
      } as any,
      {
        headers: { [PROXY_URL_HEADER]: targetUrl.href },
        body: { test: 'hello' },
      } as any,
    )
    expect(res.status).toBe(200)
  })
  afterAll(() => {
    spyFetch.mockRestore()
  })
})
