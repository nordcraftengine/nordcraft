import {
  HttpMethodsWithAllowedBody,
  NON_BODY_RESPONSE_CODES,
} from '@nordcraft/core/dist/api/api'
import type { ApiMethod } from '@nordcraft/core/dist/api/apiTypes'
import { REWRITE_HEADER } from '@nordcraft/core/dist/utils/url'
import {
  getServerToddleObject,
  serverEnv,
} from '@nordcraft/ssr/dist/rendering/formulaContext'
import {
  getRouteDestination,
  matchRouteForUrl,
} from '@nordcraft/ssr/dist/routing/routing'
import {
  REDIRECT_NAME_HEADER,
  skipCookieHeader,
} from '@nordcraft/ssr/src/utils/headers'
import type { Handler } from 'hono'
import { endTime, startTime } from 'hono/timing'
import type { StatusCode } from 'hono/utils/http-status'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'

export const routeHandler: Handler<HonoEnv<HonoRoutes & HonoProject>> = async (
  c,
  next,
) => {
  const url = new URL(c.req.url)
  const routeMatch = matchRouteForUrl({
    url,
    routes: c.var.routes?.routes ?? {},
    env: serverEnv({ branchName: 'main', req: c.req.raw, logErrors: false }),
    req: c.req.raw,
    // TODO: We should pass in global Nordcraft formulas from project + packages here
    serverContext: getServerToddleObject({} as any),
  })
  if (!routeMatch) {
    return next()
  }
  const { route, name: routeName } = routeMatch
  const destination = getRouteDestination({
    // might not want to use main branch here
    env: serverEnv({ branchName: 'main', req: c.req.raw, logErrors: false }),
    req: c.req.raw,
    route,
    // TODO: We should pass in global Nordcraft formulas from project + packages here
    serverContext: getServerToddleObject({} as any),
  })
  if (!destination) {
    return c.text(`Invalid destination`, {
      status: 500,
    })
  }
  if (route.type === 'redirect') {
    if (c.req.raw.method !== 'GET') {
      return c.text(`Method Not Allowed`, { status: 405 })
    }
    // Return a redirect to the destination with the provided status code
    c.header(REDIRECT_NAME_HEADER, routeName)
    return c.redirect(destination, route.status ?? 302)
  }

  // Rewrite handling: fetch the destination and return the response
  if (c.req.raw.headers.get(REWRITE_HEADER) !== null) {
    return c.text(`Nordcraft rewrites are not allowed to be recursive`, {
      status: 500,
    })
  }
  try {
    const headers = skipCookieHeader(c.req.raw.headers)
    // Add header to identify that this is a rewrite
    // This allows us to avoid recursive fetch calls across Nordcraft routes
    headers.set(REWRITE_HEADER, 'true')
    const timingKey = 'proxyRequest'
    startTime(c, timingKey)
    const response = await fetch(destination, {
      headers,
      method: c.req.raw.method,
      body: HttpMethodsWithAllowedBody.includes(c.req.raw.method as ApiMethod)
        ? c.req.raw.body
        : undefined,
    })
    endTime(c, timingKey)
    // Pass the stream into a new response so we can write the headers
    const body = NON_BODY_RESPONSE_CODES.includes(response.status)
      ? undefined
      : ((response.body ?? new ReadableStream()) as ReadableStream)
    response.headers.entries().forEach(([name, value]) => {
      c.header(name, value, { append: true })
    })
    c.status(response.status as StatusCode)
    if (body) {
      return c.body(body)
    }
    return c.res
  } catch {
    return c.html(
      `Unable to fetch resource defined in proxy destination: ${destination.href}`,
      { status: 500 },
    )
  }
}
