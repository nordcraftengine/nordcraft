import { REWRITE_HEADER } from '@nordcraft/core/dist/utils/url'
import * as routing from '@nordcraft/ssr/dist/routing/routing'
import { REDIRECT_NAME_HEADER } from '@nordcraft/ssr/src/utils/headers'
import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { Hono } from 'hono'
import type { HonoEnv } from '../../hono'
import { routeHandler } from './routeHandler'

const spyFetch = spyOn(globalThis, 'fetch')
const spyMatchRoute = spyOn(routing, 'matchRouteForUrl')
const spyGetRouteDestination = spyOn(routing, 'getRouteDestination')

describe('routeHandler', () => {
  beforeEach(() => {
    spyFetch.mockReset()
    spyMatchRoute.mockReset()
    spyGetRouteDestination.mockReset()
  })

  afterAll(() => {
    spyFetch.mockRestore()
    spyMatchRoute.mockRestore()
    spyGetRouteDestination.mockRestore()
  })

  it('should call next() if no route matches', async () => {
    spyMatchRoute.mockReturnValue(undefined)
    let nextCalled = false
    const app = new Hono()
    app.use('*', routeHandler)
    app.get('*', (c) => {
      nextCalled = true
      return c.text('next')
    })

    const res = await app.request('http://localhost/no-match')
    expect(res.status).toBe(200)
    expect(nextCalled).toBe(true)
  })

  it('should return 500 if destination is invalid', async () => {
    spyMatchRoute.mockReturnValue({
      route: { type: 'page', path: '/test' } as any,
      name: 'test-route',
    })
    spyGetRouteDestination.mockReturnValue(undefined)

    const app = new Hono()
    app.use('*', routeHandler)

    const res = await app.request('http://localhost/test')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Invalid destination')
  })

  it('should handle redirect routes', async () => {
    spyMatchRoute.mockReturnValue({
      route: { type: 'redirect', path: '/old', status: 301 } as any,
      name: 'old-route',
    })
    const destination = new URL('http://localhost/new')
    spyGetRouteDestination.mockReturnValue(destination)

    const app = new Hono()
    app.use('*', routeHandler)

    const res = await app.request('http://localhost/old')
    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('http://localhost/new')
    expect(res.headers.get(REDIRECT_NAME_HEADER)).toBe('old-route')
  })

  it('should prevent recursive rewrites', async () => {
    spyMatchRoute.mockReturnValue({
      route: { type: 'proxy', path: '/proxy' } as any,
      name: 'proxy-route',
    })
    spyGetRouteDestination.mockReturnValue(new URL('http://localhost/proxy'))

    const app = new Hono()
    app.use('*', routeHandler)

    const res = await app.request('http://localhost/proxy', {
      headers: {
        [REWRITE_HEADER]: 'true',
      },
    })
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      'Nordcraft rewrites are not allowed to be recursive',
    )
  })

  it('should proxy request to external destination', async () => {
    spyMatchRoute.mockReturnValue({
      route: { type: 'proxy', path: '/proxy' } as any,
      name: 'proxy-route',
    })
    const destinationUrl = 'https://external.com/api'
    spyGetRouteDestination.mockReturnValue(new URL(destinationUrl))

    spyFetch.mockResolvedValue(
      new Response('external content', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    )

    const app = new Hono()
    app.use('*', routeHandler)

    const res = await app.request('http://localhost/proxy')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('external content')
    expect(spyFetch).toHaveBeenCalled()
    const fetchArgs = spyFetch.mock.calls[0]
    expect(fetchArgs?.[0].toString()).toBe(destinationUrl)
    expect((fetchArgs?.[1]?.headers as Headers).get(REWRITE_HEADER)).toBe(
      'true',
    )
  })

  it('should handle internal proxying via app.fetch', async () => {
    spyMatchRoute.mockReturnValue({
      route: { type: 'proxy', path: '/internal' } as any,
      name: 'internal-route',
    })
    const internalUrl = 'http://localhost/internal-resource'
    spyGetRouteDestination.mockReturnValue(new URL(internalUrl))

    const innerApp = {
      fetch: async (req: Request, _env: any, _executionCtx: any) => {
        const url = typeof req === 'string' ? req : req.url
        if (url?.endsWith('/internal-resource')) {
          return new Response('internal content')
        }
        return new Response('Not Found', { status: 404 })
      },
    }

    const app = new Hono<HonoEnv>()
    app.use('*', async (c, next) => {
      c.set('app', innerApp)
      await next()
    })
    app.use('*', routeHandler)

    const res = await app.request('http://localhost/internal')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('internal content')
  })
})
