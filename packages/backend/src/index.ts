import type { ProjectFilesWithCustomCode } from '@nordcraft/ssr/dist/utils/routes'
import { getApp } from './app'
import { loadJsFile } from './middleware/jsLoader'
import { loadProjectInfo } from './middleware/projectInfo'
import { routesLoader } from './middleware/routesLoader'

const app = getApp({
  fileLoaders: [routesLoader, loadProjectInfo],
  pageLoader: {
    loader: ({ name }) =>
      loadJsFile<ProjectFilesWithCustomCode>(`./components/${name}.js`),
    urls: {
      pageStylesheetUrl: (name) => `/_static/${name}}.css`,
      customCodeUrl: (name) => `/_static/cc_${name}.js`,
    },
  },
})

export default app
