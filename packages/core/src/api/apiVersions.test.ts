import { describe, expect, test } from 'bun:test'
import type { ComponentAPI } from './apiTypes'
import {
  getApiVersionsInComponent,
  getApiVersionsInComponents,
  hasApis,
  hasApiV1,
  hasApiV2,
  isLegacyApi,
} from './apiVersions'

describe('apiVersions', () => {
  const legacyApi: ComponentAPI = { name: 'Legacy API', type: 'REST' }
  const apiV2: ComponentAPI = {
    name: 'New API',
    type: 'http',
    version: 2,
    inputs: {},
  }

  describe('isLegacyApi()', () => {
    test('it returns true for legacy APIs', () => {
      expect(isLegacyApi(legacyApi)).toBe(true)
    })

    test('it returns false for v2 APIs', () => {
      expect(isLegacyApi(apiV2)).toBe(false)
    })
  })

  describe('getApiVersionsInComponent()', () => {
    test('it detects API versions in a single component', () => {
      expect(getApiVersionsInComponent({})).toEqual({ v1: false, v2: false })
      expect(getApiVersionsInComponent({ apis: {} })).toEqual({
        v1: false,
        v2: false,
      })
      expect(
        getApiVersionsInComponent({
          apis: { legacy: legacyApi, v2: apiV2 },
        }),
      ).toEqual({ v1: true, v2: true })
    })

    test('it handles null/undefined component and API declarations', () => {
      expect(getApiVersionsInComponent(null)).toEqual({ v1: false, v2: false })
      expect(getApiVersionsInComponent(undefined)).toEqual({
        v1: false,
        v2: false,
      })
      expect(
        getApiVersionsInComponent({
          apis: { legacy: null, v2: undefined },
        }),
      ).toEqual({ v1: false, v2: false })
    })
  })

  describe('getApiVersionsInComponents()', () => {
    test('it detects API versions across components', () => {
      expect(
        getApiVersionsInComponents([{ apis: { legacy: legacyApi } }, {}]),
      ).toEqual({ v1: true, v2: false })
      expect(
        getApiVersionsInComponents([
          { apis: { legacy: legacyApi } },
          { apis: { v2: apiV2 } },
        ]),
      ).toEqual({ v1: true, v2: true })
    })

    test('it safely handles null or undefined components in the iterable', () => {
      expect(
        getApiVersionsInComponents([
          null,
          undefined,
          { apis: { legacy: legacyApi } },
        ]),
      ).toEqual({ v1: true, v2: false })
    })
  })

  describe('helpers', () => {
    test('it exposes helpers for checking API versions', () => {
      expect(hasApis({})).toBe(false)
      expect(hasApis(null)).toBe(false)
      expect(hasApiV1({ apis: { legacy: legacyApi } })).toBe(true)
      expect(hasApiV2({ apis: { legacy: legacyApi } })).toBe(false)
      expect(hasApiV1({ apis: { v2: apiV2 } })).toBe(false)
      expect(hasApiV2({ apis: { v2: apiV2 } })).toBe(true)
      expect(hasApis({ apis: { v2: apiV2 } })).toBe(true)
    })
  })
})
