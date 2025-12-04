import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import type { DurableObject } from 'cloudflare:workers'
import type { Routes } from './src/middleware/routesLoader'

export interface HonoEnv<T = never> {
  Variables: T
}

export interface PreviewHonoEnv<T = never> extends HonoEnv<T> {
  Bindings: {
    BRANCH_STATE: DurableObjectNamespace<BranchStateObject>
    PROJECT_SHORT_ID: string
    BRANCH_NAME: string
  }
}

export interface HonoProject {
  // Holds project info such as sitemap, robots and icon
  project: ToddleProject
  config: ProjectFiles['config']
}

export interface HonoRoutes {
  // Holds routes for the project
  routes: Routes
}

interface BranchStateObject extends DurableObject {
  getFiles(
    project: string,
    branchName: string,
  ): Promise<{ project: ToddleProject; files: ProjectFiles }>
}
