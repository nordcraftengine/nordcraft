import { STRING_TEMPLATE } from '@nordcraft/core/dist/api/template'
import {
  PROXY_TEMPLATES_IN_BODY,
  PROXY_URL_HEADER,
} from '@nordcraft/core/dist/utils/url'
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
      expect(req.headers.get(PROXY_TEMPLATES_IN_BODY)).toBeNull()
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
    const targetUrl = new URL('https://example.com/api')

    // The mockPostExample represents the target server's response
    // This means that it's not the proxy server's fetch call, but the destination server's fetch call
    const mockPostExample = async (req: Request) => {
      const url = new URL(req.url)
      expect(url.pathname).toBe(targetUrl.pathname)
      expect(req.method).toBe('POST')
      const body = await req.json()
      expect(body).toEqual({ myToken: 'my_refresh_token' }) // The body should have been updated with the template value
      // The PROXY_URL_HEADER should be removed from the request headers
      expect(req.headers.get(PROXY_URL_HEADER)).toBeNull()
      expect(req.headers.get(PROXY_TEMPLATES_IN_BODY)).toBeNull()
      return new Response(`{"success":true}`, { status: 200 })
    }

    spyFetch.mockImplementation(mockPostExample as any)
    const res = await client['.toddle']['omvej']['components'][
      ':componentName'
    ]['apis'][':apiName'].$post(
      {
        param: {
          componentName: 'MyComponent',
          apiName: 'MyApi',
        },
      },
      {
        headers: {
          // The destination url
          [PROXY_URL_HEADER]: targetUrl.href,
          // Indicates that the body should be read and template values applied
          [PROXY_TEMPLATES_IN_BODY]: 'true',
          Cookie: 'refresh_token=my_refresh_token; Path=/; HttpOnly',
          ['Content-Type']: 'application/json',
        },
        init: {
          body: JSON.stringify({
            myToken: STRING_TEMPLATE('cookies', 'refresh_token'),
          }),
        },
      },
    )
    expect(res.status).toBe(200)
  })
  it("Should proxy the request's body untouched if the special header is not set", async () => {
    // Create the test client from the app instance
    const client = testClient(
      new Hono().post(
        '.toddle/omvej/components/:componentName/apis/:apiName',
        proxyRequestHandler,
      ),
    )
    const targetUrl = new URL('https://example.com/api')

    // The mockPostExample represents the target server's response
    // This means that it's not the proxy server's fetch call, but the destination server's fetch call
    const mockPostExample = async (req: Request) => {
      const url = new URL(req.url)
      expect(url.pathname).toBe(targetUrl.pathname)
      expect(req.method).toBe('POST')
      const body = await req.json()
      // The body should not have been touched/updated by the proxy
      expect(body).toEqual({
        myToken: STRING_TEMPLATE('cookies', 'refresh_token'),
      })
      // The PROXY_URL_HEADER should be removed from the request headers
      expect(req.headers.get(PROXY_URL_HEADER)).toBeNull()
      expect(req.headers.get(PROXY_TEMPLATES_IN_BODY)).toBeNull()
      return new Response(`{"success":true}`, { status: 200 })
    }

    spyFetch.mockImplementation(mockPostExample as any)
    const res = await client['.toddle']['omvej']['components'][
      ':componentName'
    ]['apis'][':apiName'].$post(
      {
        param: {
          componentName: 'MyComponent',
          apiName: 'MyApi',
        },
      },
      {
        headers: {
          // The destination url
          [PROXY_URL_HEADER]: targetUrl.href,
          Cookie: 'refresh_token=my_refresh_token; Path=/; HttpOnly',
          ['Content-Type']: 'application/json',
        },
        init: {
          body: JSON.stringify({
            myToken: STRING_TEMPLATE('cookies', 'refresh_token'),
          }),
        },
      },
    )
    expect(res.status).toBe(200)
  })
  it('Should replace form-urlencoded request body with template values', async () => {
    // Create the test client from the app instance
    const client = testClient(
      new Hono().post(
        '.toddle/omvej/components/:componentName/apis/:apiName',
        proxyRequestHandler,
      ),
    )
    const targetUrl = new URL('https://example.com/api')

    // The mockPostExample represents the target server's response
    const mockPostExample = async (req: Request) => {
      const url = new URL(req.url)
      expect(url.pathname).toBe(targetUrl.pathname)
      expect(req.method).toBe('POST')
      const body = await req.text()
      // The form data should have been updated with template values
      const params = new URLSearchParams(body)
      expect(params.get('username')).toBe('test_user')
      expect(params.get('token')).toBe('my_refresh_token') // Template value applied
      expect(params.get('action')).toBe('login')
      // The PROXY_URL_HEADER should be removed from the request headers
      expect(req.headers.get(PROXY_URL_HEADER)).toBeNull()
      expect(req.headers.get(PROXY_TEMPLATES_IN_BODY)).toBeNull()
      return new Response(`{"success":true}`, { status: 200 })
    }

    spyFetch.mockImplementation(mockPostExample as any)
    const formData = new URLSearchParams()
    formData.append('username', 'test_user')
    formData.append('token', STRING_TEMPLATE('cookies', 'refresh_token'))
    formData.append('action', 'login')

    const res = await client['.toddle']['omvej']['components'][
      ':componentName'
    ]['apis'][':apiName'].$post(
      {
        param: {
          componentName: 'MyComponent',
          apiName: 'MyApi',
        },
      },
      {
        headers: {
          // The destination url
          [PROXY_URL_HEADER]: targetUrl.href,
          // Indicates that the body should be read and template values applied
          [PROXY_TEMPLATES_IN_BODY]: 'true',
          Cookie: 'refresh_token=my_refresh_token; Path=/; HttpOnly',
          ['Content-Type']: 'application/x-www-form-urlencoded',
        },
        init: {
          body: formData.toString(),
        },
      },
    )
    expect(res.status).toBe(200)
  })
  afterAll(() => {
    spyFetch.mockRestore()
  })
})
