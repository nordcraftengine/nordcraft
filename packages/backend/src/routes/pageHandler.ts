import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { matchPageForUrl } from '@nordcraft/ssr/dist/routing/routing'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import type { PageLoader } from '../loaders/types'
import { nordcraftPage } from './nordcraftPage'

export const pageHandler: (
  pageLoader: PageLoader,
) => MiddlewareHandler<HonoEnv<HonoRoutes & HonoProject>> =
  (pageLoader) => async (ctx, next) => {
    const url = new URL(ctx.req.url)
    const pageMatch = matchPageForUrl({
      url,
      pages: Object.values(ctx.var.routes.pages),
    })
    if (pageMatch) {
      const pageContent = await pageLoader({
        env: ctx.env,
        name: pageMatch.name,
      })
      const component = pageContent?.components?.[pageMatch.name]
      if (!component || !isPageComponent(component)) {
        return next()
      }
      return nordcraftPage({
        hono: ctx,
        project: ctx.var.project,
        files: pageContent,
        page: component,
        status: pageMatch.name === '404' ? 404 : 200,
      })
    }
    return next()
  }
