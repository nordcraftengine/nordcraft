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
    const page = matchPageForUrl({
      url,
      pages: Object.values(ctx.var.routes.pages),
    })
    if (page) {
      const pageContent = await pageLoader({ env: ctx.env, name: page.name })
      const component = pageContent?.components?.[page.name]
      if (!component || !isPageComponent(component)) {
        return next()
      }
      return nordcraftPage({
        hono: ctx,
        project: ctx.var.project,
        files: pageContent,
        page: component,
      })
    }
    return next()
  }
