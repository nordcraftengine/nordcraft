import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { NotFoundHandler } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'
import { nordcraftPage } from '../routes/nordcraftPage'
import { loadJsFile } from './jsLoader'

export const notFoundLoader: NotFoundHandler<
  HonoEnv<HonoRoutes & HonoProject>
> = async (ctx) => {
  const pageContent = await loadJsFile<ProjectFiles & { customCode: boolean }>(
    `./components/404.js`,
  )
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
  })
}
