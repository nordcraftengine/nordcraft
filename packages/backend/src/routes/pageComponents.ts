import { isPageComponent } from '@nordcraft/core'
import { getPageComponentsData } from '@nordcraft/ssr'
import type { Handler } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'
import type { PageLoader } from '../loaders/types'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export const pageComponentsHandler =
  ({
    pageLoader,
    cacheBuster,
  }: {
    pageLoader: PageLoader
    cacheBuster?: string
  }): Handler<HonoEnv<Partial<HonoProject>>> =>
  async (ctx) => {
    let pageName = ctx.req.param('pageName') ?? ''
    if (pageName.endsWith('.json')) {
      pageName = pageName.slice(0, -'.json'.length)
    }

    const files = await pageLoader({ ctx, name: pageName })
    const _page = files?.components?.[pageName]
    if (!files || !_page || !isPageComponent(_page)) {
      return ctx.body(null, 404)
    }

    const project = ctx.var.project?.short_id
    if (typeof project !== 'string') {
      return ctx.body(null, 500)
    }

    const data = getPageComponentsData({
      page: _page,
      files,
      projectId: project,
    })

    const requestCacheBuster = new URL(ctx.req.url).searchParams.get('v')
    const isImmutableCacheHit =
      typeof cacheBuster === 'string' && requestCacheBuster === cacheBuster

    ctx.header(
      'Cache-Control',
      isImmutableCacheHit
        ? `public, max-age=${ONE_YEAR_SECONDS}, immutable`
        : 'no-cache',
    )
    return ctx.json(data)
  }
