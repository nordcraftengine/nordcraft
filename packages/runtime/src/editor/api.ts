import type { ComponentData } from '@nordcraft/core'
import { isLegacyApi, omitKeys } from '@nordcraft/core'
import fastDeepEqual from 'fast-deep-equal'
import { getApiV2Factory, getLegacyApiFactory } from '../api/modules'
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
        newCtx.apis[api] = getLegacyApiFactory()(apiInstance, {
          ...newCtx,
          jsonPath: ['apis', api],
        })
      }
    } else {
      const existingApi = newCtx.apis[api] as ContextApiV2 | undefined
      if (!existingApi) {
        newCtx.apis[api] = getApiV2Factory()({
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
