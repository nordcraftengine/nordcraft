import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { validateUrl } from '@nordcraft/core/dist/utils/url'
import type { Context } from 'hono'
import type { HonoEnv, HonoProject } from '../../hono'

const ROBOTS_CONTENT_TYPE = 'text/plain'

export const robots = async (c: Context<HonoEnv<HonoProject>>) => {
  c.header('Content-Type', ROBOTS_CONTENT_TYPE)
  try {
    const robots = c.var.config?.meta?.robots
    // we don't provide a context below, as the formula should just be a value formula
    const robotsUrl = applyFormula(robots?.formula, undefined as any)
    const validatedRobotsUrl = validateUrl(robotsUrl)
    if (validatedRobotsUrl) {
      // return a (streamed) response with the body from robots.txt
      const { body, ok } = await fetch(validatedRobotsUrl)
      if (ok && body) {
        c.header('Cache-Control', 'public, max-age=3600')
        return c.body(body)
      }
    }
    // Provide a fallback robots.txt response
    const url = new URL(c.req.url)
    const content = `\
Sitemap: ${url.origin}/sitemap.xml

User-agent: *
Disallow: /_toddle
Disallow: /_toddle/
Disallow: /.toddle
Disallow: /.toddle/
Disallow: /.nordcraft
Disallow: /.nordcraft/
Disallow: /_api
Disallow: /_api/
Allow: /cdn-cgi/imagedelivery/*
Disallow: /cdn-cgi/
`
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(content)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return c.body(null, 404)
}
