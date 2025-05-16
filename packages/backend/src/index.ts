import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import { Hono } from 'hono'
import type { HonoEnv } from '../hono'
import { notFoundLoader } from './middleware/notFoundLoader'
import { pageLoader } from './middleware/pageLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'
import { proxyRequestHandler } from './routes/apiProxy'
import { customElement } from './routes/customElement'
import { favicon } from './routes/favicon'
import { fontRouter } from './routes/font'
import { manifest } from './routes/manifest'
import { robots } from './routes/robots'
import { routeHandler } from './routes/routeHandler'
import { serviceWorker } from './routes/serviceWorker'
import { sitemap } from './routes/sitemap'

// Inject isEqual on globalThis
// this is currently used by some builtin formulas
initIsEqual()

const app = new Hono<HonoEnv>()

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
) // project infor + single component

app.use(routesLoader, loadProjectInfo)

app.get('/*', routeHandler)

app.get('/sitemap.xml', loadProjectInfo, routesLoader, sitemap)
app.get('/robots.txt', loadProjectInfo, robots)
app.get('/manifest.json', loadProjectInfo, manifest)
app.get('/favicon.ico', loadProjectInfo, favicon)
app.get('/serviceWorker.js', loadProjectInfo, serviceWorker)

app.get('/*', pageLoader) // routes + single page

app.notFound(notFoundLoader as any)

export default app
