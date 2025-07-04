import { initIsEqual } from '@nordcraft/ssr/dist/rendering/equals'
import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { poweredBy } from 'hono/powered-by'
import type { HonoProject, HonoRoutes, PreviewHonoEnv } from '../hono'
import type { PageLoader } from './loaders/types'
import { notFoundLoader } from './middleware/notFoundLoader'
import { proxyRequestHandler } from './routes/apiProxy'
import { setCookieHandler } from './routes/cookies'
import { customElement } from './routes/customElement'
import { favicon } from './routes/favicon'
import { fontRouter } from './routes/font'
import { manifest } from './routes/manifest'
import { pageHandler } from './routes/pageHandler'
import { customCode } from './routes/preview.customCode'
import { stylesheetHandler } from './routes/preview.stylesheet'
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
app.use(
  createMiddleware<
    PreviewHonoEnv<HonoRoutes & HonoProject & { files: ProjectFiles }>
  >(async (ctx, next) => {
    // Load files from Durable Object
    const id = ctx.env.BRANCH_STATE.idFromName(
      `/projects/${ctx.env.PROJECT_SHORT_ID}/branch/${ctx.env.BRANCH_NAME}`,
    )
    const branchState = ctx.env.BRANCH_STATE.get(id)
    const fullProject: {
      project: ToddleProject
      files: ProjectFiles
    } = await branchState.getFiles(
      ctx.env.PROJECT_SHORT_ID,
      ctx.env.BRANCH_NAME,
    )
    const { project, routes } = splitRoutes(fullProject)
    ctx.set('routes', routes)
    ctx.set('project', project.project)
    ctx.set('config', project.config)
    ctx.set('files', fullProject.files)
    return next()
  }),
)

app.get('/.toddle/custom-element/:filename{.+.js}', customElement)

// Special routes for preview that generate stylesheets and custom code on demand
app.get('/.toddle/stylesheet/:pageName{.+.css}', stylesheetHandler)
app.get('/.toddle/custom-code/:pageName{.+.js}', customCode)

// Load a route if it matches the URL
app.get('/*', routeHandler)

// Load default resource endpoints
app.get('/sitemap.xml', sitemap)
app.get('/robots.txt', robots)
app.get('/manifest.json', manifest)
app.get('/favicon.ico', favicon)
app.get('/serviceWorker.js', serviceWorker)

const pageLoader: PageLoader<{ files: ProjectFiles }> = ({ ctx }) => {
  return { customCode: true, ...ctx.get('files') }
}

// Load a page if it matches the URL
app.get(
  '/*',
  pageHandler(pageLoader, {
    pageStylesheetUrl: (name: string) => `/.toddle/stylesheet/${name}.css`,
    customCodeUrl: (name: string) => `/.toddle/custom-code/${name}.js`,
  }),
)

app.notFound(notFoundLoader(pageLoader) as any)

export default app
