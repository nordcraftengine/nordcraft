import type { Context } from 'hono'
import type { HonoEnv } from '../../hono'

export type PageLoader = ({
  name,
}: {
  name: string
  env: Context<HonoEnv>['env']
}) => Promise<
  | (ProjectFiles & {
      customCode: boolean
    })
  | undefined
>
