import type { ComponentAPI, LegacyComponentAPI } from './apiTypes'
import type { LegacyToddleApi } from './LegacyToddleApi'
import type { ToddleApiV2 } from './ToddleApiV2'

export const isLegacyApi = <Handler>(
  api: ComponentAPI | LegacyToddleApi<Handler> | ToddleApiV2<Handler>,
): api is LegacyComponentAPI | LegacyToddleApi<Handler> => !('version' in api)

export type ApiVersions = {
  v1: boolean
  v2: boolean
}
