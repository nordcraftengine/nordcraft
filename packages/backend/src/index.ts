import type {
  ProjectFilesWithCustomCode,
  SsrFormulaHandler,
} from '@nordcraft/ssr'
import { getConnInfo } from 'hono/cloudflare-workers'
import { endTime, startTime } from 'hono/timing'
import { getApp } from './app'
import { loadJsFile } from './middleware/jsLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'
import { createCloudflarePageStateStore } from './routes/pageState'

const app = getApp({
  getConnInfo,
  fileLoaders: [routesLoader, loadProjectInfo],
  pageStateStore: createCloudflarePageStateStore(),
  pageLoader: {
    loader: async ({ name, ctx }) => {
      const timingKey = `pageLoader:${name}`
      startTime(ctx, timingKey)
      const file = await loadJsFile<
        ProjectFilesWithCustomCode<SsrFormulaHandler>
      >(`./components/${name}.js`)
      endTime(ctx, timingKey)
      return file
    },
    urls: {
      pageStylesheetUrl: (name) => `/_static/${name}.css`,
      customCodeUrl: (name) => `/_static/cc_${name}.js`,
    },
  },
})

export default app
