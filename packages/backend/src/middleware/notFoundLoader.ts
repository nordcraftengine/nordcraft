import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import type { NotFoundHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import type { PageLoader } from '../loaders/types'
import { nordcraftPage } from '../routes/nordcraftPage'

export const notFoundLoader: (
  pageLoader: PageLoader,
) => NotFoundHandler<HonoEnv<HonoRoutes & HonoProject>> =
  (pageLoader) => async (ctx) => {
    const pageContent = await pageLoader({ env: ctx.env, name: '404' })
    const component = pageContent?.components?.['404']
    if (!component || !isPageComponent(component)) {
      return ctx.text('Not Found', {
        status: 404,
      })
    }
    return nordcraftPage({
      hono: ctx,
      project: ctx.var.project,
      files: pageContent,
      page: component,
      status: 404,
    })
  }
