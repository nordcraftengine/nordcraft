import type { PageComponent } from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject, HonoRoutes } from '../../hono'

const SITEMAP_CONTENT_TYPE = 'application/xml'

export const sitemap = async (
  c: Context<HonoEnv<HonoProject & HonoRoutes>>,
) => {
  c.header('Content-Type', SITEMAP_CONTENT_TYPE)
  try {
    const url = new URL(c.req.url)
    const config = c.var.config
    const routes = c.var.routes
    const sitemapFormula = config?.meta?.sitemap?.formula
    if (isDefined(sitemapFormula)) {
      const sitemapUrl = validateUrl(
        // we don't provide a context for applyFormula, as the formula should just be a value formula
        applyFormula(sitemapFormula, undefined as any),
      )
      if (sitemapUrl) {
        // return a (streamed) response with the body from sitemap.xml
        const { body, ok } = await fetch(sitemapUrl)
        if (ok && body) {
          c.header('Cache-Control', 'public, max-age=3600')
          return c.body(body)
        }
      } else {
        return c.body(null, 404)
      }
    } else {
      // Provide a fallback sitemap.xml response
      const content = `\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Object.values(routes.pages)
    .filter((component, i): component is PageComponent =>
      // only include static routes
      component.route?.path.every((path) => path.type === 'static') &&
      // limit to 1000 pages for now to keep performance reasonable
      i < 1000
        ? true
        : false,
    )
    // sort by path length, so that paths with fewest arguments are first
    .sort((file1, file2) => {
      const page1PathArgs = file1.route.path.length
      const page2PathArgs = file2.route.path.length
      return page1PathArgs - page2PathArgs
    })
    .map(
      (file) => `
<url>
  <loc>${url.origin}/${file.route.path.map((p) => p.name).join('/')}</loc>
</url>`,
    )
    .join('')}
</urlset>`

      c.header('Cache-Control', 'public, max-age=3600')
      return c.body(content)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return c.body(null, { status: 404 })
}
