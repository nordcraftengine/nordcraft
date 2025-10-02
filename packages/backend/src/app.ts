import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import { Hono, type Handler, type MiddlewareHandler } from 'hono'
import { poweredBy } from 'hono/powered-by'
import { timing } from 'hono/timing'
import type { HonoEnv } from '../hono'
import type { PageLoader, PageLoaderUrls } from './loaders/types'
import { notFoundLoader } from './middleware/notFoundLoader'
import { proxyRequestHandler } from './routes/apiProxy'
import { setCookieHandler } from './routes/cookies'
import { customElement } from './routes/customElement'
import { favicon } from './routes/favicon'
import { fontRouter } from './routes/font'
import { manifest } from './routes/manifest'
import { pageHandler } from './routes/pageHandler'
import { robots } from './routes/robots'
import { routeHandler } from './routes/routeHandler'
import { serviceWorker } from './routes/serviceWorker'
import { sitemap } from './routes/sitemap'

export const getApp = <T extends Record<string, any>>(options: {
  staticRouter?: { path: string; handler: Handler }
  stylesheetRouter?: { path: string; handler: Handler }
  customCodeRouter?: { path: string; handler: Handler }
  pageLoader: {
    loader: PageLoader
    urls: PageLoaderUrls
  }
  fileLoaders: MiddlewareHandler[]
}) => {
  // Inject isEqual on globalThis used by some builtin formulas
  initIsEqual()

  const app = new Hono<HonoEnv<T>>({ strict: false })

  app.use(
    timing({
      // Potentially only enable detailed timing in development mode
      // to avoid potential timing attacks in production
      // See https://developers.cloudflare.com/workers/reference/security-model/#step-1-disallow-timers-and-multi-threading
      enabled: true,
    }),
  )

  app.use(poweredBy({ serverName: 'Nordcraft' })) // 🌲🌲🌲

  if (options.staticRouter) {
    app.use(options.staticRouter.path, options.staticRouter.handler)
  }

  // Nordcraft specific endpoints/services on /.toddle/ subpath 👇
  app.route('/.toddle/fonts', fontRouter)
  // Proxy endpoint for Nordcraft APIs
  app.all(
    '/.toddle/omvej/components/:componentName/apis/:apiName',
    proxyRequestHandler,
  )
  app.get('/.nordcraft/cookies/set-cookie', setCookieHandler)

  // Load project info and all routes for endpoints below to use
  app.use(...options.fileLoaders)

  app.get('/.toddle/custom-element/:filename{.+.js}', customElement)

  if (options.stylesheetRouter) {
    app.get(options.stylesheetRouter.path, options.stylesheetRouter.handler)
  }
  if (options.customCodeRouter) {
    app.get(options.customCodeRouter.path, options.customCodeRouter.handler)
  }

  // Load a route if it matches the URL
  app.all('/*', routeHandler)

  // Load default resource endpoints
  app.get('/sitemap.xml', sitemap)
  app.get('/robots.txt', robots)
  app.get('/manifest.json', manifest)
  app.get('/favicon.ico', favicon)
  app.get('/serviceWorker.js', serviceWorker)

  // Load a page if it matches the URL
  app.get('/*', pageHandler(options.pageLoader.loader, options.pageLoader.urls))

  app.notFound(
    notFoundLoader(options.pageLoader.loader, options.pageLoader.urls) as any,
  )

  return app
}
