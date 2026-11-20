import type {
  ProjectFilesWithCustomCode,
  SsrFormulaHandler,
} from '@nordcraft/ssr'
import type { Context } from 'hono'
import type { HonoEnv } from '../../hono'

type MaybePromise<T> = T | Promise<T>

export type PageLoader<T = any> = ({
  name,
}: {
  name: string
  ctx: Context<HonoEnv<T>>
}) => MaybePromise<ProjectFilesWithCustomCode<SsrFormulaHandler> | undefined>

export interface PageLoaderUrls {
  pageStylesheetUrl: (name: string) => string
  customCodeUrl: (name: string) => string
  pageComponentsUrl?: (name: string) => string
}
