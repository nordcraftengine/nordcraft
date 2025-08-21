import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import { createMiddleware } from 'hono/factory'
import type { HonoProject, HonoRoutes, PreviewHonoEnv } from '../hono'
import { getApp } from './app'
import { customCode } from './routes/preview.customCode'
import { stylesheetHandler } from './routes/preview.stylesheet'

const app = getApp({
  stylesheetRouter: {
    path: '/.toddle/stylesheet/:pageName{.+.css}',
    handler: stylesheetHandler,
  },
  customCodeRouter: {
    path: '/.toddle/custom-code/:pageName{.+.js}',
    handler: customCode,
  },
  pageLoader: ({ ctx }) => {
    return { customCode: true, ...ctx.get('files') }
  },
  fileLoaders: [
    createMiddleware<
      PreviewHonoEnv<HonoRoutes & HonoProject & { files: ProjectFiles }>
    >(async (ctx, next) => {
      const projectShortId = ctx.env.PROJECT_SHORT_ID
      const branchName = ctx.env.BRANCH_NAME
      if (!projectShortId || !branchName) {
        return ctx.text('Project short ID and branch name are required', {
          status: 400,
        })
      }
      // Load files from Durable Object
      const id = ctx.env.BRANCH_STATE.idFromName(
        `/projects/${projectShortId}/branch/${branchName}`,
      )
      const branchState = ctx.env.BRANCH_STATE.get(id)
      const fullProject: {
        project: ToddleProject
        files: ProjectFiles
      } = await branchState.getFiles(projectShortId, branchName)
      const { project, routes } = splitRoutes(fullProject)
      ctx.set('routes', routes)
      ctx.set('project', project.project)
      ctx.set('config', project.config)
      ctx.set('files', fullProject.files)
      return next()
    }),
  ],
})

export default app
