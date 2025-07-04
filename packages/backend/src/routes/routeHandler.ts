import { NON_BODY_RESPONSE_CODES } from '@nordcraft/core/dist/api/api'
import { REWRITE_HEADER } from '@nordcraft/core/dist/utils/url'
import {
  getServerToddleObject,
  serverEnv,
} from '@nordcraft/ssr/dist/rendering/formulaContext'
import {
  getRouteDestination,
  matchRouteForUrl,
} from '@nordcraft/ssr/dist/routing/routing'
import { REDIRECT_NAME_HEADER } from '@nordcraft/ssr/src/utils/headers'
import type { Handler } from 'hono'
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
    // Return a redirect to the destination with the provided status code
    c.header(REDIRECT_NAME_HEADER, routeName)
    return c.body(null, route.status ?? 302)
  }

  // Rewrite handling: fetch the destination and return the response
  if (c.req.raw.headers.get(REWRITE_HEADER) !== null) {
    return c.text(`Nordcraft rewrites are not allowed to be recursive`, {
      status: 500,
    })
  }
  try {
    const requestHeaders = new Headers()
    // Ensure this server can read the response by overriding potentially
    // unsupported accept headers from the client (brotli etc.)
    requestHeaders.set('accept-encoding', 'gzip')
    requestHeaders.set('accept', '*/*')
    // Add header to identify that this is a rewrite
    // This allows us to avoid recursive fetch calls across Nordcraft routes
    requestHeaders.set(REWRITE_HEADER, 'true')
    const response = await fetch(destination, {
      headers: requestHeaders,
      // Routes can only be GET requests
      method: 'GET',
    })
    // Pass the stream into a new response so we can write the headers
    const body = NON_BODY_RESPONSE_CODES.includes(response.status)
      ? undefined
      : ((response.body ?? new ReadableStream()) as ReadableStream)

    const returnResponse = new Response(body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(
          response.headers
            .entries()
            // Filter out content-encoding as it breaks decoding on the client 🤷‍♂️
            .filter(([key]) => key !== 'content-encoding'),
        ),
      },
    })
    return returnResponse
  } catch {
    return c.html(
      `Internal server error when fetching url: ${destination.href}`,
      { status: 500 },
    )
  }
}
