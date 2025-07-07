import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { matchPageForUrl } from '@nordcraft/ssr/dist/routing/routing'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import { loadJsFile } from '../middleware/jsLoader'
import { nordcraftPage } from './nordcraftPage'

export const pageHandler: MiddlewareHandler<
  HonoEnv<HonoRoutes & HonoProject>
> = async (ctx, next) => {
  const url = new URL(ctx.req.url)
  const pageMatch = matchPageForUrl({
    url,
    pages: Object.values(ctx.var.routes.pages),
  })
  if (pageMatch) {
    const pageContent = await loadJsFile<
      ProjectFiles & { customCode: boolean }
    >(`./components/${pageMatch.name}.js`)
    const page = pageContent?.components?.[pageMatch.name]
    if (!page || !isPageComponent(page)) {
      return next()
    }
    return nordcraftPage({
      hono: ctx,
      project: ctx.var.project,
      files: pageContent,
      page: page,
      status: page.name === '404' ? 404 : 200,
    })
  }
  return next()
}
