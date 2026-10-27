import type { Component } from '@nordcraft/core'
import { getApiVersionsInComponents } from '@nordcraft/core'
import type { createLegacyAPI } from './createAPI'
import type { createAPI } from './createAPIv2'

type ApiModuleFactories = {
  createLegacyAPI?: typeof createLegacyAPI
  createAPI?: typeof createAPI
}

type ApiV1Module = { createLegacyAPI: typeof createLegacyAPI }
type ApiV2Module = { createAPI: typeof createAPI }

type ApiVersion = 1 | 2

const factories: ApiModuleFactories = {}

const loading: Partial<Record<ApiVersion, Promise<void>>> = {}

// The API modules are built as separate assets and served next to the
// runtime. Resolving the URL relative to this module keeps working no matter
// where the runtime is hosted.
const apiModuleUrl = (version: ApiVersion) =>
  new URL(`./api-v${version}.main.esm.js`, import.meta.url).href

const importModule = <T>(url: string) =>
  import(/* @vite-ignore */ url) as Promise<T>

const loadApiV1 = () =>
  (loading[1] ??= importModule<ApiV1Module>(apiModuleUrl(1)).then((module) => {
    factories.createLegacyAPI = module.createLegacyAPI
  }))

const loadApiV2 = () =>
  (loading[2] ??= importModule<ApiV2Module>(apiModuleUrl(2)).then((module) => {
    factories.createAPI = module.createAPI
  }))

/**
 * Load the API runtime modules required by the given components.
 *
 * Only the modules that are actually needed are imported. The imports are
 * cached, so calling this multiple times only loads each module once.
 */
export const loadApiModules = async (components: Iterable<Component>) => {
  const { v1, v2 } = getApiVersionsInComponents(components)
  await Promise.all([
    v1 ? loadApiV1() : undefined,
    v2 ? loadApiV2() : undefined,
  ])
}

/**
 * Register the API factories directly. This is used by runtimes that bundle
 * the API code themselves (e.g. the editor preview).
 */
export const registerApiModules = (modules: ApiModuleFactories) => {
  factories.createLegacyAPI ??= modules.createLegacyAPI
  factories.createAPI ??= modules.createAPI
}

export const getLegacyApiFactory = () => {
  if (!factories.createLegacyAPI) {
    throw new Error('The API v1 runtime has not been loaded')
  }
  return factories.createLegacyAPI
}

export const getApiV2Factory = () => {
  if (!factories.createAPI) {
    throw new Error('The API v2 runtime has not been loaded')
  }
  return factories.createAPI
}
