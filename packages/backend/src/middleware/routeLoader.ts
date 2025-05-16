import {
  getServerToddleObject,
  serverEnv,
} from '@nordcraft/ssr/dist/rendering/formulaContext'
import { matchRouteForUrl } from '@nordcraft/ssr/dist/routing/routing'
import type { Route } from '@nordcraft/ssr/dist/ssr.types'
import { createMiddleware } from 'hono/factory'
import type { HonoEnv, HonoRoute, HonoRoutes } from '../../hono'

const routes: Partial<Record<string, Route>> = {}

export const routeLoader = createMiddleware<HonoEnv<HonoRoutes & HonoRoute>>(
  async (ctx, next) => {
    const url = new URL(ctx.req.url)
    let route: Route | undefined = routes[url.pathname]
    if (route) {
      ctx.set('route', route)
      routes[url.pathname] = route
      return next()
    }
    route = matchRouteForUrl({
      // might not want to use main branch here
      env: serverEnv({ branchName: 'main', req: c.req.raw, logErrors: false }),
      req: ctx.req.raw,
      url,
      routes: ctx.var.routes.routes,
      // TODO: We should pass in global toddle formulas from project + packages here
      serverContext: getServerToddleObject({} as any),
    })
    if (!route) {
      return next()
    }
    routes[url.pathname] = route
    ctx.set('route', route)
    return next()
  },
)
