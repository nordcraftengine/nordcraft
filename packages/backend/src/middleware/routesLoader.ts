import type { RouteDeclaration } from '@nordcraft/core/dist/component/component.types'
import type { Route } from '@nordcraft/ssr/dist/ssr.types'
import { createMiddleware } from 'hono/factory'
import type { HonoEnv, HonoRoutes } from '../../hono'
import { loadJsFile } from './jsLoader'

export interface Routes {
  pages: Record<string, { name: string; route: RouteDeclaration }>
  routes: Record<string, Route>
}

let routes: Routes | undefined

export const routesLoader = createMiddleware<HonoEnv<HonoRoutes>>(
  async (ctx, next) => {
    if (!routes) {
      routes = await loadJsFile<Routes>('./routes.js')
      if (!routes) {
        return ctx.text('Route declarations for project not found', {
          status: 404,
        })
      }
    }
    ctx.set('routes', routes)
    return next()
  },
)
