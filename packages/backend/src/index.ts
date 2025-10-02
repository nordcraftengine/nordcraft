import type { ProjectFilesWithCustomCode } from '@nordcraft/ssr/dist/utils/routes'
import { endTime, startTime } from 'hono/timing'
import { getApp } from './app'
import { loadJsFile } from './middleware/jsLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'

const app = getApp({
  fileLoaders: [routesLoader, loadProjectInfo],
  pageLoader: {
    loader: async ({ name, ctx }) => {
      const timingKey = `pageLoader:${name}`
      startTime(ctx, timingKey)
      const file = await loadJsFile<ProjectFilesWithCustomCode>(
        `./components/${name}.js`,
      )
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
