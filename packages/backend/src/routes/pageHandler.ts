import { isPageComponent } from '@nordcraft/core'
import { matchPageForUrl } from '@nordcraft/ssr'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import type { PageLoader, PageLoaderUrls } from '../loaders/types'
import { nordcraftPage } from './nordcraftPage'
import type { PageStateStore } from './pageState'

export const pageHandler: (
  pageLoader: PageLoader,
  options: PageLoaderUrls,
  pageStateStore?: PageStateStore,
) => MiddlewareHandler<HonoEnv<HonoRoutes & HonoProject>> =
  (pageLoader, options, pageStateStore) => async (ctx, next) => {
    const url = new URL(ctx.req.url)
    const pageMatch = matchPageForUrl({
      url,
      pages: Object.values(ctx.var.routes.pages),
    })
    if (pageMatch) {
      const pageContent = await pageLoader({ ctx, name: pageMatch.name })
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
        options,
        pageStateStore,
      })
    }
    return next()
  }
