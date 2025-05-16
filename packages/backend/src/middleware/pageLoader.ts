import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { matchPageForUrl } from '@nordcraft/ssr/dist/routing/routing'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import { nordcraftPage } from '../routes/nordcraftPage'
import { loadJsFile } from './jsLoader'

export const pageLoader: MiddlewareHandler<
  HonoEnv<HonoRoutes & HonoProject>
> = async (ctx, next) => {
  const url = new URL(ctx.req.url)
  const page = matchPageForUrl({
    url,
    components: ctx.var.routes.pages,
  })
  if (page) {
    const pageContent = await loadJsFile<
      ProjectFiles & { customCode: boolean }
    >(`./components/${page.name}.js`)
    const component = pageContent?.components?.[page.name]
    if (!component || !isPageComponent(component)) {
      return next()
    }
    return nordcraftPage({
      req: ctx.req.raw,
      project: ctx.var.project,
      // TODO: pass in global toddle formulas
      files: {} as any,
      page: component,
    })
  }
  return next()
}
