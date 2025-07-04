import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { poweredBy } from 'hono/powered-by'
import type { HonoRoutes, PreviewHonoEnv } from '../hono'
import type { PageLoader } from './loaders/types'
import { loadJsFile } from './middleware/jsLoader'
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

// Inject isEqual on globalThis used by some builtin formulas
initIsEqual()

const app = new Hono<PreviewHonoEnv>({ strict: false })

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
const fileLoader = createMiddleware<PreviewHonoEnv<HonoRoutes>>(
  async (ctx, next) => {
    console.log(ctx.env)
    // Load files from Durable Object
    const id = ctx.env.BRANCH_STATE.idFromName(
      `/projects/${ctx.env.PROJECT_SHORT_ID}/branch/${ctx.env.BRANCH_NAME}`,
    )
    const branchState = ctx.env.BRANCH_STATE.get(id)
    const fullProject = await branchState.getFiles(
      ctx.env.PROJECT_SHORT_ID,
      ctx.env.BRANCH_NAME,
    )
    const { project, routes, files, styles, code } = splitRoutes(fullProject)
    // ctx.set('routes', )
    return next()
  },
)
app.use(fileLoader)

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
  loadJsFile<ProjectFiles & { customCode: boolean }>(`./components/${name}.js`)

// Load a page if it matches the URL
app.get('/*', pageHandler(pageLoader))

app.notFound(notFoundLoader(pageLoader) as any)

export default app
