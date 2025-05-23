import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import { Hono } from 'hono'
import type { HonoEnv } from '../hono'
import { notFoundLoader } from './middleware/notFoundLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'
import { proxyRequestHandler } from './routes/apiProxy'
import { customElement } from './routes/customElement'
import { favicon } from './routes/favicon'
import { fontRouter } from './routes/font'
import { manifest } from './routes/manifest'
import { pageHandler } from './routes/pageHandler'
import { robots } from './routes/robots'
import { routeHandler } from './routes/routeHandler'
import { serviceWorker } from './routes/serviceWorker'
import { sitemap } from './routes/sitemap'

// Inject isEqual on globalThis used by some builtin formulas
initIsEqual()

const app = new Hono<HonoEnv>({ strict: false })

// Nordcraft specific endpoints/services on /.toddle/ subpath 👇
app.route('/.toddle/fonts', fontRouter)
// Proxy endpoint for Nordcraft APIs
app.all(
  '/.toddle/omvej/components/:componentName/apis/:apiName',
  proxyRequestHandler,
)
app.get(
  '/.toddle/custom-element/:filename{.+.js}',
  loadProjectInfo,
  customElement,
)

// Load project info and all routes for endpoints below to use
app.use(routesLoader, loadProjectInfo)

// Load a route if it matches the URL
app.get('/*', routeHandler)

// Load default resource endpoints
app.get('/sitemap.xml', loadProjectInfo, routesLoader, sitemap)
app.get('/robots.txt', loadProjectInfo, robots)
app.get('/manifest.json', loadProjectInfo, manifest)
app.get('/favicon.ico', loadProjectInfo, favicon)
app.get('/serviceWorker.js', loadProjectInfo, serviceWorker)

// Load a page if it matches the URL
app.get('/*', pageHandler)

app.notFound(notFoundLoader as any)

export default app
