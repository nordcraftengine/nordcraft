import type { Component } from '@nordcraft/core/dist/component/component.types'
import type { ProjectFiles, ToddleProject } from '@nordcraft/ssr/dist/ssr.types'
import type { Routes } from './src/middleware/routesLoader'

export interface HonoEnv<T = never> {
  Variables: T
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

export interface HonoComponent {
  // Holds all relevant files for a given component
  files: ProjectFiles & { customCode: boolean }
  component: Component
}
