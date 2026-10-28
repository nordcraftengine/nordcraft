import type { Component } from '@nordcraft/core'
import { isDefined, isLegacyApi, type ApiVersions } from '@nordcraft/core'

export type { ApiVersions }

/**
 * Get the API versions used by a component (or page).
 */
export const getApiVersionsInComponent = (
  component?: Pick<Component, 'apis'> | null,
): ApiVersions => {
  const versions: ApiVersions = { v1: false, v2: false }
  for (const api of Object.values(component?.apis ?? {})) {
    if (!isDefined(api)) {
      continue
    }
    if (isLegacyApi(api)) {
      versions.v1 = true
    } else {
      versions.v2 = true
    }
    if (versions.v1 && versions.v2) {
      break
    }
  }
  return versions
}

/**
 * Get the API versions used by a set of components.
 */
export const getApiVersionsInComponents = (
  components: Iterable<Pick<Component, 'apis'> | null | undefined>,
): ApiVersions => {
  const versions: ApiVersions = { v1: false, v2: false }
  for (const component of components) {
    const componentVersions = getApiVersionsInComponent(component)
    versions.v1 ||= componentVersions.v1
    versions.v2 ||= componentVersions.v2
    if (versions.v1 && versions.v2) {
      break
    }
  }
  return versions
}

/**
 * Check if a component (or page) has any API v1 (legacy) APIs declared.
 */
export const hasApiV1 = (component?: Pick<Component, 'apis'> | null) =>
  getApiVersionsInComponent(component).v1

/**
 * Check if a component (or page) has any API v2 APIs declared.
 */
export const hasApiV2 = (component?: Pick<Component, 'apis'> | null) =>
  getApiVersionsInComponent(component).v2

/**
 * Check if a component (or page) has any APIs declared.
 */
export const hasApis = (component?: Pick<Component, 'apis'> | null) => {
  const { v1, v2 } = getApiVersionsInComponent(component)
  return v1 || v2
}
