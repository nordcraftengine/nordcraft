import type { PageComponent } from '@nordcraft/core/dist/component/component.types'
import { isPageComponent } from '@nordcraft/core/dist/component/isPageComponent'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import type { HonoEnv } from '../../hono'

const SITEMAP_CONTENT_TYPE = 'application/xml'

export const sitemap = async (c: Context<HonoEnv>) => {
  try {
    const url = new URL(c.req.url)
    const project = c.var.project
    const sitemapFormula = project.files.config?.meta?.sitemap?.formula
    if (isDefined(sitemapFormula)) {
      const requestUrl = new URL(c.req.url)
      const sitemapUrl = validateUrl(
        // we don't provide a context for applyFormula, as the formula should just be a value formula
        {
          path: applyFormula(sitemapFormula, undefined as any),
          origin: requestUrl.origin,
        },
      )
      if (sitemapUrl) {
        // return a (streamed) response with the body from sitemap.xml
        const { body, ok } = await fetch(sitemapUrl)
        if (ok && body) {
          c.header('Content-Type', SITEMAP_CONTENT_TYPE)
          c.header('Cache-Control', 'public, max-age=3600')
          return stream(c, (s) => s.pipe(body as any))
        }
      } else {
        return new Response(null, { status: 404 })
      }
    } else {
      // Provide a fallback sitemap.xml response
      const content = `\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Object.values(project.files.components)
    .filter((component, i): component is PageComponent =>
      component &&
      isPageComponent(component) &&
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

      return new Response(content, {
        headers: {
          'Content-Type': SITEMAP_CONTENT_TYPE,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  } catch (e) {
    console.error(e)
  }
  return new Response(null, { status: 404 })
}
