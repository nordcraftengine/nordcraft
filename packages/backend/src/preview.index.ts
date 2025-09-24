import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import { splitRoutes } from '@nordcraft/ssr/dist/utils/routes'
import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { HonoProject, HonoRoutes, PreviewHonoEnv } from '../hono'
import { getApp } from './app'
import { customCode } from './routes/preview.customCode'
import { stylesheetHandler } from './routes/preview.stylesheet'

type PreviewData = HonoRoutes &
  HonoProject & {
    files: ProjectFiles
  }

let projectLoadTime: Date | undefined
let projectLoader: Promise<PreviewData> | null = null
const loadProject = ({
  projectShortId,
  branchName,
  ctx,
}: {
  projectShortId: string
  branchName: string
  ctx: Context<PreviewHonoEnv<PreviewData>>
}) => {
  if (
    projectLoader &&
    // Reload the project if it's older than 10 seconds
    projectLoadTime?.getTime() &&
    Date.now() - projectLoadTime.getTime() < 1000 * 10
  ) {
    return projectLoader
  }
  projectLoadTime = new Date()
  // eslint-disable-next-line no-async-promise-executor
  projectLoader = new Promise(async (resolve, reject) => {
    // Load files from Durable Object
    const id = ctx.env.BRANCH_STATE.idFromName(
      `/projects/${projectShortId}/branch/${branchName}`,
    )
    const branchState = ctx.env.BRANCH_STATE.get(id)
    const doProject = (await branchState.getFiles(
      projectShortId,
      branchName,
    )) as
      | {
          project: ToddleProject
          files: ProjectFiles
        }
      | undefined
    if (!doProject) {
      return reject('Project or branch not found')
    }
    const { routes } = splitRoutes(doProject)
    resolve({
      routes,
      project: doProject.project,
      config: doProject.files.config,
      files: doProject.files,
    })
  })
  return projectLoader
}

const app = getApp({
  stylesheetRouter: {
    path: '/.toddle/stylesheet/:pageName{.+.css}',
    handler: stylesheetHandler,
  },
  customCodeRouter: {
    path: '/.toddle/custom-code/:pageName{.+.js}',
    handler: customCode,
  },
  pageLoader: {
    loader: ({ ctx }) => {
      return { customCode: true, ...ctx.get('files') }
    },
    urls: {
      pageStylesheetUrl: (name: string) => `/.toddle/stylesheet/${name}.css`,
      customCodeUrl: (name: string) => `/.toddle/custom-code/${name}.js`,
    },
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
      try {
        const fullProject = await loadProject({
          projectShortId,
          branchName,
          ctx,
        })
        ctx.set('routes', fullProject.routes)
        ctx.set('project', fullProject.project)
        ctx.set('config', fullProject.files.config)
        ctx.set('files', fullProject.files)
        return await next()
      } catch (error) {
        return ctx.text(`Error loading project: ${error}`, { status: 500 })
      }
    }),
  ],
})

export default app
