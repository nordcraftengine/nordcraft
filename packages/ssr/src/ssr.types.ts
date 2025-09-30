import type {
  ApiBase,
  RedirectStatusCode,
} from '@nordcraft/core/dist/api/apiTypes'
import type {
  Component,
  RouteDeclaration,
} from '@nordcraft/core/dist/component/component.types'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { PluginFormula } from '@nordcraft/core/dist/formula/formulaTypes'
import type { OldTheme, Theme } from '@nordcraft/core/dist/styling/theme'
import type { PluginAction } from '@nordcraft/core/dist/types'

export type FileGetter = (args: {
  package?: string
  name: string
  type: keyof ProjectFiles
}) => Promise<
  Component | PluginAction | PluginFormula<string> | Route | Theme | ApiService
>

export interface ToddleProject {
  name: string
  description?: string | null
  short_id: string
  id: string
  emoji?: string | null
  type: 'app' | 'package'
  thumbnail?: { path: string } | null
}

export interface ProjectFiles {
  // Partial to make sure we check for the existence of a Component
  components: Partial<Record<string, Component>>
  packages?: Partial<Record<string, InstalledPackage>>
  actions?: Record<string, PluginAction>
  formulas?: Record<string, PluginFormula<string>>
  routes?: Record<string, Route>
  config?: {
    // See https://github.com/nordcraftengine/nordcraft/releases
    runtimeVersion?: string
    theme: OldTheme
    meta?: {
      icon?: { formula: Formula }
      robots?: { formula: Formula }
      sitemap?: { formula: Formula }
      manifest?: { formula: Formula }
      serviceWorker?: { formula: Formula }
    }
  }
  themes?: Record<string, Theme>
  services?: Record<string, ApiService>
}

interface BaseApiService {
  name: string // Should we deprecate this?
  baseUrl?: Formula
  docsUrl?: Formula
  apiKey?: Formula
  meta?: Record<string, unknown>
}

interface SupabaseApiService extends BaseApiService {
  type: 'supabase'
  meta?: {
    projectUrl?: Formula
  }
}

interface XanoApiService extends BaseApiService {
  type: 'xano'
}

interface CustomApiService extends BaseApiService {
  type: 'custom'
}

export type ApiService = SupabaseApiService | XanoApiService | CustomApiService

export type InstalledPackage = Pick<
  ProjectFiles,
  // we might want to add themes + config later
  'components' | 'actions' | 'formulas'
> & {
  manifest: {
    name: string
    // commit represents the commit hash (version) of the package
    commit: string
  }
}

interface BaseRoute {
  source: RouteDeclaration
  destination: ApiBase
  enabled?: { formula: Formula }
}

export interface RewriteRoute extends BaseRoute {
  type: 'rewrite'
}

export interface RedirectRoute extends BaseRoute {
  type: 'redirect'
  status?: RedirectStatusCode
}

export type Route = RewriteRoute | RedirectRoute
