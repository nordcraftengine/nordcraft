import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import type { ProjectFilesWithCustomCode } from '@nordcraft/ssr/dist/utils/routes'
import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'
import type { HonoEnv } from '../hono'
import type { PageLoader } from './loaders/types'
import { loadJsFile } from './middleware/jsLoader'
import { notFoundLoader } from './middleware/notFoundLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'
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

// Inject isEqual on globalThis used by some builtin formulas
initIsEqual()

const app = new Hono<HonoEnv>({ strict: false })

app.use(poweredBy({ serverName: 'Nordcraft' })) // 🌲🌲🌲

// Nordcraft specific endpoints/services on /.toddle/ subpath 👇
app.route('/.toddle/fonts', fontRouter)
// Proxy endpoint for Nordcraft APIs
app.all(
  '/.toddle/omvej/components/:componentName/apis/:apiName',
  proxyRequestHandler,
)
app.get('/.nordcraft/cookies/set-cookie', setCookieHandler)

// Load project info and all routes for endpoints below to use
app.use(routesLoader, loadProjectInfo)

app.get('/.toddle/custom-element/:filename{.+.js}', customElement)

// Load a route if it matches the URL
app.get('/*', routeHandler)

// Load default resource endpoints
app.get('/sitemap.xml', sitemap)
app.get('/robots.txt', robots)
app.get('/manifest.json', manifest)
app.get('/favicon.ico', favicon)
app.get('/serviceWorker.js', serviceWorker)

const pageLoader: PageLoader = ({ name }) =>
  loadJsFile<ProjectFilesWithCustomCode>(`./components/${name}.js`)

// Load a page if it matches the URL
app.get('/*', pageHandler(pageLoader))

app.notFound(notFoundLoader(pageLoader) as any)

export default app
