import { isLegacyApi } from '@nordcraft/core/dist/api/api'
import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { omitKeys } from '@nordcraft/core/dist/utils/collections'
import fastDeepEqual from 'fast-deep-equal'
import { createLegacyAPI } from '../api/createAPI'
import { createAPI } from '../api/createAPIv2'
import type { Signal } from '../signal/signal'
import type { ComponentContext, ContextApiV2 } from '../types'

export const syncComponentApis = (
  newCtx: ComponentContext,
  previousCtx: ComponentContext | null,
  dataSignal: Signal<ComponentData>,
) => {
  for (const api in newCtx.component.apis) {
    // check if the api has changed (ignoring onCompleted and onFailed).
    const apiInstance = newCtx.component.apis[api]
    if (!apiInstance) {
      continue
    }
    const previousApiInstance = previousCtx?.component.apis?.[api]
    if (isLegacyApi(apiInstance)) {
      if (
        fastDeepEqual(
          omitKeys(apiInstance, ['onCompleted', 'onFailed']),
          previousApiInstance && isLegacyApi(previousApiInstance)
            ? omitKeys(previousApiInstance, ['onCompleted', 'onFailed'])
            : (previousApiInstance ?? {}),
        ) === false
      ) {
        newCtx.apis[api]?.destroy()
        dataSignal.update((data) => {
          return {
            ...data,
            Apis: omitKeys(data.Apis ?? {}, [
              ...Object.keys(data.Apis ?? {}).filter(
                // remove any data from an api that is not part of the component
                (key) => !newCtx.component.apis?.[key],
              ),
              api,
            ]),
          }
        })
        newCtx.apis[api] = createLegacyAPI(apiInstance, {
          ...newCtx,
          jsonPath: ['apis', api],
        })
      }
    } else {
      const existingApi = newCtx.apis[api] as ContextApiV2 | undefined
      if (!existingApi) {
        newCtx.apis[api] = createAPI({
          apiRequest: apiInstance,
          ctx: { ...newCtx, jsonPath: ['apis', api] },
          componentData: dataSignal.get(),
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        existingApi?.update(apiInstance, dataSignal.get())
      }
    }
  }
}
