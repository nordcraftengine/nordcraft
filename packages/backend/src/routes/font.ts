import type { Context } from 'hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { endTime, startTime } from 'hono/timing'
import type { HonoEnv } from '../../hono'

export const fontRouter = new Hono<HonoEnv, any, '/.toddle/fonts/'>()
// TODO: We need to support CORS for custom-elements that need to fetch fonts
// Eventually, we should allow specifying which origins are allowed to fetch fonts (and custom elements)
fontRouter.use(cors())

// Proxy endpoint for Google Fonts stylesheet
// Font references are replaced with ./toddle/fonts/font
fontRouter.get('/stylesheet/:stylesheet{.*}', async (c: Context<HonoEnv>) => {
  const req = c.req
  const requestUrl = new URL(req.url)
  try {
    const timingKey = 'stylesheetFetch'
    startTime(c, timingKey)
    const response = (await fetch(
      `https://fonts.googleapis.com/${req.param('stylesheet')}${
        requestUrl.search
      }`,
      standardFontRequestInit(req.raw),
    )) as any as Response
    endTime(c, timingKey)
    let stylesheetContent = await response.text()
    if (response.ok) {
      stylesheetContent = stylesheetContent.replaceAll(
        'https://fonts.gstatic.com',
        // This should match the path in the font route below 👇
        // This ensures fonts are fetched through the proxied endpoint /.toddle/fonts/font/...
        '/.toddle/fonts/font',
      )
    } else {
      c.header('Content-Type', 'text/css; charset=utf-8')
      return c.body('Stylesheet not found', 404)
    }
    const headers = filterFontResponseHeaders(response.headers)
    Array.from(headers.entries()).forEach(([name, value]) =>
      c.header(name, value, { append: true }),
    )
    return c.body(stylesheetContent)
  } catch {
    c.header('Content-Type', 'text/css; charset=utf-8')
    return c.body('Stylesheet could not be generated', 404)
  }
})

fontRouter.get('/font/:font{.*}', async (c: Context<HonoEnv>) => {
  try {
    const init = standardFontRequestInit(c.req.raw)
    const response = (await fetch(
      `https://fonts.gstatic.com/${c.req.param('font')}`,
      init,
    )) as any as Response
    const headers = filterFontResponseHeaders(response.headers)
    Array.from(headers.entries()).forEach(([name, value]) =>
      c.header(name, value, { append: true }),
    )
    if (response.ok && response.body) {
      return c.body(response.body, response.status as any)
    } else {
      return c.text('Font not found', 404)
    }
  } catch {
    return c.text('Unable to fetch font', 404)
  }
})

const standardFontRequestInit = (req: Request): RequestInit => ({
  method: req.method,
  headers: [
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Referer',
    'User-Agent',
  ]
    .map((name) => [name, req.headers.get(name)])
    .filter((h): h is [string, string] => typeof h[1] === 'string'),
})

const filterFontResponseHeaders = (headers: Headers) =>
  new Headers(
    [
      'Content-Type',
      'Cache-Control',
      'Expires',
      'Accept-Ranges',
      'Date',
      'Last-Modified',
      'ETag',
    ]
      .map((name) => [name, headers.get(name)])
      .filter((h): h is [string, string] => typeof h[1] === 'string'),
  )
