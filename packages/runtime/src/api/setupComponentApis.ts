import type { ComponentAPI, ComponentData, Nullable } from '@nordcraft/core'
import { isDefined, isLegacyApi } from '@nordcraft/core'
import type { ComponentContext, ContextApi } from '../types'
import type { createLegacyAPI as CreateLegacyAPIFn } from './createAPI'
import type { createAPI as CreateAPIFn } from './createAPIv2'
import { sortApis } from './sortApis'

export type SetupComponentApis = (params: {
  apis: Record<string, Nullable<ComponentAPI>>
  createCtx: (name: string, api: ComponentAPI) => ComponentContext
  componentData: ComponentData
  targetApis: Record<string, ContextApi>
  createLegacyAPI?: typeof CreateLegacyAPIFn
  createAPI?: typeof CreateAPIFn
}) => void

export const setupComponentApis: SetupComponentApis = ({
  apis,
  createCtx,
  componentData,
  targetApis,
  createLegacyAPI,
  createAPI,
}) => {
  sortApis(
    Object.entries(apis).filter((entry): entry is [string, ComponentAPI] =>
      isDefined(entry[1]),
    ),
  ).forEach(([name, api]) => {
    const ctx = createCtx(name, api)
    if (isLegacyApi(api)) {
      if (!createLegacyAPI) {
        throw new Error('The API v1 runtime has not been loaded')
      }
      targetApis[name] = createLegacyAPI(api, ctx)
    } else {
      if (!createAPI) {
        throw new Error('The API v2 runtime has not been loaded')
      }
      targetApis[name] = createAPI({
        apiRequest: api,
        ctx,
        componentData,
      })
    }
  })

  Object.values(targetApis).forEach((api) => {
    if ('triggerActions' in api && typeof api.triggerActions === 'function') {
      api.triggerActions(componentData)
    }
  })
}
