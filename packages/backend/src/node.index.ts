import { serve } from '@hono/node-server'
import { getConnInfo } from '@hono/node-server/conninfo'
import { serveStatic } from '@hono/node-server/serve-static'
import type { ProjectFilesWithCustomCode } from '@nordcraft/ssr/dist/utils/routes'
import { compress } from 'hono/compress'
import { getApp } from './app'
import { loadJsFile } from './middleware/jsLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'

const app = getApp({
  getConnInfo,
  fileLoaders: [routesLoader, loadProjectInfo],
  staticRouter: {
    path: '/_static/*',
    handler: serveStatic({ root: './assets' }),
  },
  pageLoader: {
    loader: ({ name }) =>
      loadJsFile<ProjectFilesWithCustomCode>(`./components/${name}.js`),
    urls: {
      pageStylesheetUrl: (name) => `/_static/${name}.css`,
      customCodeUrl: (name) => `/_static/cc_${name}.js`,
    },
  },
  // Middleware that will enable gzip/deflate compression for responses
  // This could be replaced with a more advanced setup if needed - e.g. nginx in front of the app with brotli support
  earlyMiddleware: [compress()],
})

serve(app)
